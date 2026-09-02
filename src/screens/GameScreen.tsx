import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Modal,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Board } from '../components/Board';
import { CatSprite } from '../components/CatSprite';
import { GameButton } from '../components/GameButton';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import { useLevelProgress } from '../hooks/useLevelProgress';
import { COLORS, globalStyles } from '../constants/theme';
import { CatPiece, GridCoordinates, getCatShapeSize } from '../models/Cat';
import { BoxGridConfig, getNextLevelId, starsFromJumpOuts } from '../models/Level';
import { getOccupiedCells, isValidPlacement } from '../utils/gridSolver';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const FIRST_JUMP_MS = 10000;
const NEXT_JUMP_MS = 6000;

interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HoverCell {
  x: number;
  y: number;
  valid: boolean;
}

interface DraggableCatProps {
  cat: CatPiece;
  trayIndex: number;
  trayCount: number;
  tileSize: number;
  gridRect: ScreenRect | null;
  overlayRect: ScreenRect | null;
  gridConfig: BoxGridConfig;
  existingCats: CatPiece[];
  onDropCat: (catId: string, coords: GridCoordinates | null, valid: boolean) => void;
  onRotate: (catId: string) => void;
  onDragChange: (dragging: boolean) => void;
  draggingCatId: SharedValue<string | null>;
  onHoverCells: (cells: HoverCell[] | null) => void;
  ejectedCatId: string | null;
}

const toLocal = (windowX: number, windowY: number, overlay: ScreenRect | null) => ({
  x: windowX - (overlay?.x ?? 0),
  y: windowY - (overlay?.y ?? 0),
});

const getTrayPosition = (index: number, total: number, overlay: ScreenRect | null) => {
  const cols = Math.min(4, Math.max(total, 1));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const slot = 68;
  const totalWidth = cols * slot;
  const startX = (SCREEN_WIDTH - totalWidth) / 2;
  const overlayOffsetY = overlay?.y ?? 0;
  return {
    x: startX - (overlay?.x ?? 0) + col * slot,
    y: SCREEN_HEIGHT - overlayOffsetY - 168 + row * 62,
  };
};

const DraggableCatPiece: React.FC<DraggableCatProps> = ({
  cat,
  trayIndex,
  trayCount,
  tileSize,
  gridRect,
  overlayRect,
  gridConfig,
  existingCats,
  onDropCat,
  onRotate,
  onDragChange,
  draggingCatId,
  onHoverCells,
  ejectedCatId,
}) => {
  const { playSound } = useAudio();
  const shapeSize = getCatShapeSize(cat.shapeMatrix);
  const pieceWidth = shapeSize.width * tileSize;
  const pieceHeight = shapeSize.height * tileSize;
  const tray = getTrayPosition(trayIndex, trayCount, overlayRect);
  const isPlaced = Boolean(cat.currentPosition && gridRect && overlayRect);

  const starting = (() => {
    if (isPlaced && cat.currentPosition && gridRect) {
      const local = toLocal(
        gridRect.x + cat.currentPosition.x * tileSize,
        gridRect.y + cat.currentPosition.y * tileSize,
        overlayRect
      );
      return local;
    }
    return tray;
  })();

  const globalX = useSharedValue(starting.x);
  const globalY = useSharedValue(starting.y);
  const startDragX = useSharedValue(0);
  const startDragY = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleAudioMeow = () => {
    playSound('meow');
  };

  const snapToRest = (ejected: boolean) => {
    const target = (() => {
      if (cat.currentPosition && gridRect) {
        return toLocal(
          gridRect.x + cat.currentPosition.x * tileSize,
          gridRect.y + cat.currentPosition.y * tileSize,
          overlayRect
        );
      }
      return tray;
    })();

    if (ejected && !cat.currentPosition) {
      globalY.value = withSequence(
        withTiming(globalY.value - 48, { duration: 140 }),
        withSpring(target.y, { damping: 14, stiffness: 110 })
      );
      globalX.value = withSpring(target.x, { damping: 14, stiffness: 110 });
      return;
    }

    globalX.value = withSpring(target.x, { damping: 15, stiffness: 120 });
    globalY.value = withSpring(target.y, { damping: 15, stiffness: 120 });
  };

  const calculateGridPos = (absX: number, absY: number) => {
    if (!gridRect) return null;

    const relX = absX - gridRect.x;
    const relY = absY - gridRect.y;
    const gridWidth = gridConfig.cols * tileSize;
    const gridHeight = gridConfig.rows * tileSize;
    const insideBoard =
      absX >= gridRect.x &&
      absY >= gridRect.y &&
      absX <= gridRect.x + gridWidth &&
      absY <= gridRect.y + gridHeight;

    if (!insideBoard) {
      return null;
    }

    const pointerCellX = Math.floor(relX / tileSize);
    const pointerCellY = Math.floor(relY / tileSize);
    const candidatePositions: Array<{ x: number; y: number; distance: number; valid: boolean }> = [];

    for (let y = 0; y <= gridConfig.rows - shapeSize.height; y++) {
      for (let x = 0; x <= gridConfig.cols - shapeSize.width; x++) {
        const distance =
          Math.abs(x + (shapeSize.width - 1) / 2 - pointerCellX) +
          Math.abs(y + (shapeSize.height - 1) / 2 - pointerCellY);
        const valid = isValidPlacement(
          cat,
          { x, y },
          gridConfig,
          existingCats.filter((c) => c.id !== cat.id)
        );
        candidatePositions.push({ x, y, distance, valid });
      }
    }

    candidatePositions.sort(
      (a, b) => a.distance - b.distance || Number(b.valid) - Number(a.valid)
    );

    const nearestValid = candidatePositions.find((candidate) => candidate.valid);
    const nearestAny = candidatePositions[0];
    const chosen = nearestValid ?? nearestAny;

    if (!chosen) {
      return null;
    }

    return {
      gridX: chosen.x,
      gridY: chosen.y,
      isValid: chosen.valid,
    };
  };

  const updateHoverState = (absX: number, absY: number) => {
    const res = calculateGridPos(absX, absY);
    if (res) {
      onHoverCells(
        getOccupiedCells(cat.shapeMatrix, { x: res.gridX, y: res.gridY }).map((cell) => ({
          ...cell,
          valid: res.isValid,
        }))
      );
    } else {
      onHoverCells(null);
    }
  };

  const processDrop = (absX: number, absY: number) => {
    const res = calculateGridPos(absX, absY);
    onHoverCells(null);
    onDragChange(false);

    if (res && res.isValid && gridRect) {
      const local = toLocal(
        gridRect.x + res.gridX * tileSize,
        gridRect.y + res.gridY * tileSize,
        overlayRect
      );
      globalX.value = withSpring(local.x, { damping: 15, stiffness: 120 });
      globalY.value = withSpring(local.y, { damping: 15, stiffness: 120 });
      onDropCat(cat.id, { x: res.gridX, y: res.gridY }, true);
      return;
    }

    if (res && !res.isValid) {
      snapToRest(false);
      onDropCat(cat.id, { x: res.gridX, y: res.gridY }, false);
      return;
    }

    globalX.value = withSpring(tray.x, { damping: 14, stiffness: 100 });
    globalY.value = withSpring(tray.y, { damping: 14, stiffness: 100 });
    onDropCat(cat.id, null, true);
  };

  const handleRotate = () => {
    onRotate(cat.id);
  };

  const panGesture = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      'worklet';
      draggingCatId.value = cat.id;
      scale.value = withSpring(1.08);
      startDragX.value = globalX.value;
      startDragY.value = globalY.value;
      runOnJS(onDragChange)(true);
      runOnJS(handleAudioMeow)();
    })
    .onUpdate((event) => {
      'worklet';
      globalX.value = startDragX.value + event.translationX;
      globalY.value = startDragY.value + event.translationY;
      runOnJS(updateHoverState)(event.absoluteX, event.absoluteY);
    })
    .onFinalize((event) => {
      'worklet';
      draggingCatId.value = null;
      scale.value = withSpring(1);
      runOnJS(processDrop)(event.absoluteX, event.absoluteY);
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(handleRotate)();
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  useEffect(() => {
    if (draggingCatId.value === cat.id) return;
    snapToRest(ejectedCatId === cat.id);
  }, [
    cat.currentPosition?.x,
    cat.currentPosition?.y,
    cat.shapeMatrix,
    gridRect?.x,
    gridRect?.y,
    tray.x,
    tray.y,
    ejectedCatId,
    tileSize,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: globalX.value,
    top: globalY.value,
    transform: [{ scale: scale.value }],
    zIndex: draggingCatId.value === cat.id ? 999 : 10,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.catGlobalWrapper,
          { width: pieceWidth, height: pieceHeight },
          animatedStyle,
        ]}
      >
        <CatSprite
          breed={cat.breed}
          pose={cat.pose}
          width={pieceWidth - 4}
          height={pieceHeight - 4}
          shapeMatrix={cat.shapeMatrix}
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default function GameScreen({ route, navigation }: Props) {
  const { levelId } = route.params;
  const draggingCatId = useSharedValue<string | null>(null);
  const overlayRef = useRef<View>(null);
  const progressSavedRef = useRef(false);

  const [gridRect, setGridRect] = useState<ScreenRect | null>(null);
  const [overlayRect, setOverlayRect] = useState<ScreenRect | null>(null);
  const [hoverCells, setHoverCells] = useState<HoverCell[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    level,
    unpackedCats,
    placedCats,
    isComplete,
    jumpOutCount,
    ejectedCatId,
    actionNonce,
    placeCat,
    unplaceCat,
    rotateCat,
    ejectRandomCat,
    resetLevel,
  } = useGameState(levelId);

  const { recordWin } = useLevelProgress();
  const { playSound } = useAudio();
  const allCats = useMemo(() => [...unpackedCats, ...placedCats], [unpackedCats, placedCats]);
  const trayCount = level.availableCats.length;
  const nextLevelId = getNextLevelId(level.id);
  const tileSize = Math.min(60, Math.floor((SCREEN_WIDTH - 96) / Math.max(level.gridConfig.cols, 1)));

  const trayIndexById = useMemo(() => {
    const map = new Map<string, number>();
    level.availableCats.forEach((cat, index) => map.set(cat.id, index));
    return map;
  }, [level.availableCats]);

  const measureOverlay = useCallback(() => {
    overlayRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setOverlayRect({ x, y, width, height });
      }
    });
  }, []);

  useEffect(() => {
    const handle = setTimeout(measureOverlay, 50);
    return () => clearTimeout(handle);
  }, [level.id, tileSize, measureOverlay]);

  useEffect(() => {
    progressSavedRef.current = false;
  }, [level.id]);

  useEffect(() => {
    if (!isComplete || progressSavedRef.current) return;
    progressSavedRef.current = true;
    playSound('purr');
    recordWin(level.id, starsFromJumpOuts(jumpOutCount));
  }, [isComplete, jumpOutCount, level.id, playSound, recordWin]);

  useEffect(() => {
    if (isComplete || isDragging || placedCats.length === 0) return;
    const delay = ejectedCatId ? NEXT_JUMP_MS : FIRST_JUMP_MS;
    const timer = setTimeout(() => {
      ejectRandomCat();
    }, delay);
    return () => clearTimeout(timer);
  }, [isComplete, isDragging, placedCats.length, jumpOutCount, actionNonce, ejectRandomCat]);

  const handleDropCat = (catId: string, coords: GridCoordinates | null, valid: boolean) => {
    if (!coords) {
      unplaceCat(catId);
      return;
    }
    if (valid) {
      placeCat(catId, coords);
    }
  };

  const highlightLocal = (cellX: number, cellY: number) => {
    if (!gridRect || !overlayRect) return { left: 0, top: 0 };
    return {
      left: gridRect.x - overlayRect.x + cellX * tileSize,
      top: gridRect.y - overlayRect.y + cellY * tileSize,
    };
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View
        ref={overlayRef}
        onLayout={measureOverlay}
        style={styles.screenRoot}
      >
        <View style={styles.hudBar}>
          <TouchableOpacity
            style={globalStyles.iconButton}
            onPress={() => navigation.navigate('LevelSelect')}
          >
            <Text style={styles.iconText}>🏠</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <Text style={styles.hudText}>Level {level.id}</Text>
            <Text style={styles.hudText}>
              Packed {placedCats.length}/{level.availableCats.length}
            </Text>
          </View>

          <TouchableOpacity style={globalStyles.iconButton} onPress={resetLevel}>
            <Text style={styles.iconText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.boxTitle}>
            {isComplete ? 'Level Complete!' : level.title}
          </Text>
          <Text style={styles.hintText}>Drag into the box • Tap to rotate</Text>
        </View>

        <View style={styles.boardArea}>
          <View style={styles.boardWrapper}>
            <Board
              gridConfig={level.gridConfig}
              tileSize={tileSize}
              onGridMeasured={setGridRect}
            />
          </View>
        </View>

        <View style={styles.trayContainer} pointerEvents="box-none">
          <Text style={styles.trayTitle}>UNPACKED CATS</Text>
          <View style={styles.catTrayList} pointerEvents="none">
            {level.availableCats.map((cat) => (
              <View
                key={`placeholder-${cat.id}`}
                style={[
                  styles.catTraySlotPlaceholder,
                  unpackedCats.some((item) => item.id === cat.id) && styles.catTraySlotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {hoverCells?.map((cell) => {
          const pos = highlightLocal(cell.x, cell.y);
          return (
            <View
              key={`hover-${cell.x}-${cell.y}`}
              pointerEvents="none"
              style={[
                styles.hoverCell,
                {
                  left: pos.left,
                  top: pos.top,
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: cell.valid ? 'rgba(76, 175, 80, 0.45)' : 'rgba(244, 67, 54, 0.45)',
                  borderColor: cell.valid ? '#4CAF50' : '#F44336',
                },
              ]}
            />
          );
        })}

        {allCats.map((cat) => (
          <DraggableCatPiece
            key={cat.id}
            cat={cat}
            trayIndex={trayIndexById.get(cat.id) ?? 0}
            trayCount={trayCount}
            tileSize={tileSize}
            gridConfig={level.gridConfig}
            existingCats={placedCats}
            gridRect={gridRect}
            overlayRect={overlayRect}
            onHoverCells={setHoverCells}
            onDropCat={handleDropCat}
            onRotate={rotateCat}
            onDragChange={setIsDragging}
            draggingCatId={draggingCatId}
            ejectedCatId={ejectedCatId}
          />
        ))}
      </View>

      <Modal visible={isComplete} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>All cats packed!</Text>
            <Text style={styles.modalStars}>
              {'★'.repeat(starsFromJumpOuts(jumpOutCount))}
              {'☆'.repeat(3 - starsFromJumpOuts(jumpOutCount))}
            </Text>
            <Text style={styles.modalBody}>
              {jumpOutCount === 0
                ? 'Nobody jumped out. Perfect packing.'
                : `${jumpOutCount} cat${jumpOutCount === 1 ? '' : 's'} jumped out along the way.`}
            </Text>
            {nextLevelId != null && (
              <GameButton
                title="NEXT LEVEL"
                variant="primary"
                style={{ width: '100%', minWidth: 220 }}
                onPress={() => navigation.replace('Game', { levelId: nextLevelId })}
              />
            )}
            <GameButton
              title="LEVEL SELECT"
              variant="secondary"
              style={{ width: '100%', minWidth: 220 }}
              onPress={() => navigation.navigate('LevelSelect')}
            />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  screenRoot: {
    flex: 1,
    position: 'relative',
  },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 40,
    marginBottom: 8,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.textDark,
    gap: 12,
  },
  hudText: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 14,
    color: COLORS.textDark,
  },
  iconText: {
    fontSize: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 4,
    zIndex: 10,
  },
  boxTitle: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 20,
    color: COLORS.textDark,
  },
  hintText: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  boardArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  boardWrapper: {
    position: 'relative',
  },
  trayContainer: {
    width: '90%',
    backgroundColor: COLORS.primaryBgDark,
    borderRadius: 16,
    padding: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.textDark,
    alignSelf: 'center',
    zIndex: 1,
  },
  trayTitle: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  catTrayList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minHeight: 60,
  },
  catTraySlotPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.cardboardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardboardBorder,
    opacity: 0.25,
  },
  catTraySlotActive: {
    opacity: 0.45,
  },
  catGlobalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverCell: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 8,
    zIndex: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 62, 61, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.primaryBg,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: COLORS.cardboardDark,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 24,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  modalStars: {
    fontSize: 28,
    marginVertical: 8,
    color: '#E6A817',
  },
  modalBody: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
});
