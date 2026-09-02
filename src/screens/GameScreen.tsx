import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Board } from '../components/Board';
import { CatSprite } from '../components/CatSprite';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import { COLORS, globalStyles } from '../constants/theme';
import { CatPiece, GridCoordinates, getCatShapeSize } from '../models/Cat';
import { BoxGridConfig } from '../models/Level';
import { isValidPlacement } from '../utils/gridSolver';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const TILE_SIZE = 60;
const BOARD_PADDING = 16;

interface BoardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HoverState {
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: SharedValue<number>;
  height: SharedValue<number>;
  visible: SharedValue<boolean>;
  isValid: SharedValue<boolean>;
}

interface DraggableCatProps {
  cat: CatPiece;
  boardRect: BoardRect | null;
  gridConfig: BoxGridConfig;
  existingCats: CatPiece[];
  onDropCat: (catId: string, coords: GridCoordinates | null) => void;
  draggingCatId: SharedValue<string | null>;
  hoverState: HoverState;
  index: number;
}

const DraggableCatPiece: React.FC<DraggableCatProps> = ({
  cat,
  boardRect,
  gridConfig,
  existingCats,
  onDropCat,
  draggingCatId,
  hoverState,
  index,
}) => {
  const { playSound } = useAudio();

  // Resting coordinates in tray
  const trayX = SCREEN_WIDTH / 2 - 100 + (index % 4) * 55;
  const trayY = SCREEN_HEIGHT - 170;

  const shapeSize = getCatShapeSize(cat.shapeMatrix);
  const pieceWidth = shapeSize.width * TILE_SIZE;
  const pieceHeight = shapeSize.height * TILE_SIZE;

  // Grid inner offset on screen
  const gridOriginX = boardRect ? boardRect.x + BOARD_PADDING : 0;
  const gridOriginY = boardRect ? boardRect.y + BOARD_PADDING : 0;

  const isPlaced = Boolean(cat.currentPosition && boardRect);
  const startingX = isPlaced
    ? gridOriginX + (cat.currentPosition?.x ?? 0) * TILE_SIZE
    : trayX;
  const startingY = isPlaced
    ? gridOriginY + (cat.currentPosition?.y ?? 0) * TILE_SIZE
    : trayY;

  const globalX = useSharedValue(startingX);
  const globalY = useSharedValue(startingY);

  const startDragX = useSharedValue(0);
  const startDragY = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleAudioMeow = () => {
    playSound('meow');
  };

  const calculateGridPos = (absX: number, absY: number) => {
    if (!boardRect) return null;

    // Relative offset against the actual active board grid
    const relX = absX - gridOriginX;
    const relY = absY - gridOriginY;

    const gridX = Math.floor(relX / TILE_SIZE);
    const gridY = Math.floor(relY / TILE_SIZE);

    const isWithinBounds =
      gridX >= 0 &&
      gridY >= 0 &&
      gridX + shapeSize.width <= gridConfig.columns &&
      gridY + shapeSize.height <= gridConfig.rows;

    if (!isWithinBounds) return null;

    const isValid = isValidPlacement(
      cat,
      { x: gridX, y: gridY },
      gridConfig,
      existingCats.filter((c) => c.id !== cat.id)
    );

    return { gridX, gridY, isValid };
  };

  const updateHoverState = (absX: number, absY: number) => {
    const res = calculateGridPos(absX, absY);
    if (res) {
      hoverState.x.value = res.gridX * TILE_SIZE;
      hoverState.y.value = res.gridY * TILE_SIZE;
      hoverState.width.value = shapeSize.width * TILE_SIZE;
      hoverState.height.value = shapeSize.height * TILE_SIZE;
      hoverState.isValid.value = res.isValid;
      hoverState.visible.value = true;
    } else {
      hoverState.visible.value = false;
    }
  };

  const processDrop = (absX: number, absY: number) => {
    const res = calculateGridPos(absX, absY);

    if (res && res.isValid) {
      const snapX = gridOriginX + res.gridX * TILE_SIZE;
      const snapY = gridOriginY + res.gridY * TILE_SIZE;

      globalX.value = withSpring(snapX, { damping: 15, stiffness: 120 });
      globalY.value = withSpring(snapY, { damping: 15, stiffness: 120 });

      onDropCat(cat.id, { x: res.gridX, y: res.gridY });
    } else {
      globalX.value = withSpring(trayX, { damping: 14, stiffness: 100 });
      globalY.value = withSpring(trayY, { damping: 14, stiffness: 100 });

      onDropCat(cat.id, null);
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      draggingCatId.value = cat.id;
      scale.value = withSpring(1.1);
      startDragX.value = globalX.value;
      startDragY.value = globalY.value;

      runOnJS(handleAudioMeow)();
    })
    .onUpdate((event) => {
      'worklet';
      globalX.value = startDragX.value + event.translationX;
      globalY.value = startDragY.value + event.translationY;

      // absoluteX and absoluteY reflect exact screen touch point
      runOnJS(updateHoverState)(event.absoluteX, event.absoluteY);
    })
    .onFinalize((event) => {
      'worklet';
      draggingCatId.value = null;
      scale.value = withSpring(1);
      hoverState.visible.value = false;

      runOnJS(processDrop)(event.absoluteX, event.absoluteY);
    });

  useEffect(() => {
    if (draggingCatId.value === cat.id) return;

    const targetX =
      cat.currentPosition && boardRect
        ? gridOriginX + cat.currentPosition.x * TILE_SIZE
        : trayX;
    const targetY =
      cat.currentPosition && boardRect
        ? gridOriginY + cat.currentPosition.y * TILE_SIZE
        : trayY;

    globalX.value = withSpring(targetX, { damping: 15, stiffness: 120 });
    globalY.value = withSpring(targetY, { damping: 15, stiffness: 120 });
  }, [cat.currentPosition, boardRect, trayX, trayY]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: globalX.value,
    top: globalY.value,
    transform: [{ scale: scale.value }],
    zIndex: draggingCatId.value === cat.id ? 999 : 10,
  }));

  return (
    <GestureDetector gesture={panGesture}>
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
        />
      </Animated.View>
    </GestureDetector>
  );
};

export default function GameScreen({ route, navigation }: Props) {
  const { levelId } = route.params;
  const draggingCatId = useSharedValue<string | null>(null);
  const boardViewRef = useRef<View>(null);

  const [boardRect, setBoardRect] = useState<BoardRect | null>(null);

  // Dynamic cell hover highlight states
  const hoverX = useSharedValue(0);
  const hoverY = useSharedValue(0);
  const hoverWidth = useSharedValue(TILE_SIZE);
  const hoverHeight = useSharedValue(TILE_SIZE);
  const hoverVisible = useSharedValue(false);
  const hoverIsValid = useSharedValue(true);

  const hoverState: HoverState = {
    x: hoverX,
    y: hoverY,
    width: hoverWidth,
    height: hoverHeight,
    visible: hoverVisible,
    isValid: hoverIsValid,
  };

  const {
    level,
    unpackedCats,
    placedCats,
    movesLeft,
    score,
    isComplete,
    placeCat,
    unplaceCat,
    resetLevel,
  } = useGameState(levelId);

  const allCats = useMemo(() => [...unpackedCats, ...placedCats], [unpackedCats, placedCats]);

  const measureBoard = () => {
    if (boardViewRef.current) {
      boardViewRef.current.measure((_x, _y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          setBoardRect({ x: pageX, y: pageY, width, height });
        }
      });
    }
  };

  const highlightStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: hoverX.value + BOARD_PADDING,
    top: hoverY.value + BOARD_PADDING,
    width: hoverWidth.value,
    height: hoverHeight.value,
    opacity: hoverVisible.value ? 1 : 0,
    backgroundColor: hoverIsValid.value
      ? 'rgba(76, 175, 80, 0.45)'
      : 'rgba(244, 67, 54, 0.45)',
    borderColor: hoverIsValid.value ? '#4CAF50' : '#F44336',
    borderWidth: 3,
    borderRadius: 8,
    zIndex: 15,
  }));

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[globalStyles.container, styles.transparentContainer]}>
        {/* HUD Header */}
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
              Moves: {movesLeft}/{level.maxMoves}
            </Text>
            <Text style={styles.hudText}>Score: {score}</Text>
          </View>

          <TouchableOpacity
            style={globalStyles.iconButton}
            onPress={resetLevel}
          >
            <Text style={styles.iconText}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Level Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.boxTitle}>
            {isComplete ? '🎉 Level Complete!' : level.title}
          </Text>
        </View>

        {/* Board Container */}
        <View style={styles.boardArea}>
          <View
            ref={boardViewRef}
            onLayout={measureBoard}
            style={styles.boardWrapper}
          >
            <Board
              gridConfig={level.gridConfig}
              tileSize={TILE_SIZE}
            />
            {/* Grid Highlight Component Overlay */}
            <Animated.View pointerEvents="none" style={highlightStyle} />
          </View>
        </View>

        {/* Tray Placeholder Area */}
        <View style={styles.trayContainer} pointerEvents="box-none">
          <Text style={styles.trayTitle}>UNPACKED CATS</Text>
          <View style={styles.catTrayList} pointerEvents="none">
            {unpackedCats.map((cat) => (
              <View key={`placeholder-${cat.id}`} style={styles.catTraySlotPlaceholder} />
            ))}
          </View>
        </View>

        {/* Floating Absolute Cat Layer */}
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 20 }]} pointerEvents="box-none">
          {allCats.map((cat, idx) => (
            <DraggableCatPiece
              key={cat.id}
              index={idx}
              cat={cat}
              gridConfig={level.gridConfig}
              existingCats={placedCats}
              boardRect={boardRect}
              hoverState={hoverState}
              onDropCat={(catId, coords) => {
                if (coords) {
                  placeCat(catId, coords);
                } else {
                  if (unplaceCat) {
                    unplaceCat(catId);
                  }
                }
              }}
              draggingCatId={draggingCatId}
            />
          ))}
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  transparentContainer: {
    backgroundColor: 'transparent',
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
    gap: 12,
    justifyContent: 'center',
    height: 60,
  },
  catTraySlotPlaceholder: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: COLORS.cardboardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardboardBorder,
    opacity: 0.4,
  },
  catGlobalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});