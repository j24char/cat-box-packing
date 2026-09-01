// src/screens/GameScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
import { CatPiece, GridCoordinates } from '../models/Cat';
import { BoxGridConfig } from '../models/Level';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

const TILE_SIZE = 60;

interface DraggableCatProps {
  cat: CatPiece;
  boxMeasurements?: { x: number; y: number } | null;
  gridConfig: BoxGridConfig;
  onDropCat: (catId: string, coords: GridCoordinates | null) => void;
  draggingCatId: SharedValue<string | null>;
  index: number;
}

// Inside src/screens/GameScreen.tsx

const DraggableCatPiece: React.FC<DraggableCatProps> = ({
  cat,
  boxMeasurements,
  gridConfig,
  onDropCat,
  draggingCatId,
  index,
}) => {
  const { playSound } = useAudio();

  // Distribute unpacked cats horizontally in tray
  const trayX = SCREEN_WIDTH / 2 - 100 + (index % 4) * 55; 
  const trayY = SCREEN_HEIGHT - 170;

  // Account for Board padding (16px) to match tile start coordinates
  const BOARD_PADDING = 16;
  const boardX = boxMeasurements ? boxMeasurements.x + BOARD_PADDING : 0;
  const boardY = boxMeasurements ? boxMeasurements.y + BOARD_PADDING : 0;

  const isPlaced = Boolean(cat.currentPosition && boxMeasurements);
  const startingX = isPlaced
    ? boardX + (cat.currentPosition?.x ?? 0) * TILE_SIZE
    : trayX;
  const startingY = isPlaced
    ? boardY + (cat.currentPosition?.y ?? 0) * TILE_SIZE
    : trayY;

  const globalX = useSharedValue(startingX);
  const globalY = useSharedValue(startingY);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    if (draggingCatId.value === cat.id) return;

    const targetX = cat.currentPosition && boxMeasurements
      ? boardX + (cat.currentPosition.x) * TILE_SIZE
      : trayX;
    const targetY = cat.currentPosition && boxMeasurements
      ? boardY + (cat.currentPosition.y) * TILE_SIZE
      : trayY;

    globalX.value = withSpring(targetX, { damping: 15, stiffness: 120 });
    globalY.value = withSpring(targetY, { damping: 15, stiffness: 120 });
  }, [cat.currentPosition, boxMeasurements, trayX, trayY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      draggingCatId.value = cat.id;
      offsetX.value = globalX.value;
      offsetY.value = globalY.value;

      runOnJS(playSound)('meow');
    })
    .onUpdate((event) => {
      globalX.value = offsetX.value + event.translationX;
      globalY.value = offsetY.value + event.translationY;
    })
    .onEnd(() => {
      draggingCatId.value = null;

      if (!boxMeasurements) {
        globalX.value = withSpring(trayX);
        globalY.value = withSpring(trayY);
        return;
      }

      // Calculate position relative to tile layout start
      const relX = globalX.value - boardX;
      const relY = globalY.value - boardY;

      const gridX = Math.round(relX / TILE_SIZE);
      const gridY = Math.round(relY / TILE_SIZE);

      const isValidCell =
        gridX >= 0 &&
        gridX < gridConfig.cols &&
        gridY >= 0 &&
        gridY < gridConfig.rows &&
        gridConfig.mask[gridY]?.[gridX] === 1;

      if (isValidCell) {
        // Snap to center of target cell in box
        const snapX = boardX + gridX * TILE_SIZE;
        const snapY = boardY + gridY * TILE_SIZE;

        globalX.value = withSpring(snapX, { damping: 14 });
        globalY.value = withSpring(snapY, { damping: 14 });

        runOnJS(onDropCat)(cat.id, { x: gridX, y: gridY });
      } else {
        // Return back to tray
        globalX.value = withSpring(trayX, { damping: 12, stiffness: 90 });
        globalY.value = withSpring(trayY, { damping: 12, stiffness: 90 });

        runOnJS(onDropCat)(cat.id, null);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: globalX.value },
      { translateY: globalY.value },
      { scale: withSpring(draggingCatId.value === cat.id ? 1.15 : 1) },
    ],
    zIndex: draggingCatId.value === cat.id ? 999 : 10,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.catGlobalWrapper,
          { width: TILE_SIZE, height: TILE_SIZE },
          animatedStyle,
        ]}
      >
        <CatSprite breed={cat.breed} pose={cat.pose} size={TILE_SIZE - 4} />
      </Animated.View>
    </GestureDetector>
  );
};

export default function GameScreen({ route, navigation }: Props) {
  const { levelId } = route.params;
  const draggingCatId = useSharedValue<string | null>(null);

  const [boxMeasurements, setBoxMeasurements] = useState<{ x: number; y: number } | null>(null);

  const {
    level,
    unpackedCats,
    placedCats,
    movesLeft,
    score,
    isComplete,
    placeCat,
    resetLevel,
  } = useGameState(levelId);

  const allCats = useMemo(() => [...unpackedCats, ...placedCats], [unpackedCats, placedCats]);

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

        {/* Board Drop Zone */}
        <View style={styles.boardArea}>
          <Board
            gridConfig={level.gridConfig}
            tileSize={TILE_SIZE}
            onLayoutMeasured={(m) => setBoxMeasurements({ x: m.x, y: m.y })}
          />
        </View>

        {/* Unpacked Cats Tray Placeholder */}
        <View style={styles.trayContainer} pointerEvents="box-none">
          <Text style={styles.trayTitle}>UNPACKED CATS</Text>
          <View style={styles.catTrayList} pointerEvents="none">
             {unpackedCats.map((cat) => (
                <View key={`placeholder-${cat.id}`} style={styles.catTraySlotPlaceholder}/>
             ))}
          </View>
        </View>

        {/* Interactive Cats Layer */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {allCats.map((cat, idx) => (
            <DraggableCatPiece
              key={cat.id}
              index={idx}
              cat={cat}
              gridConfig={level.gridConfig}
              boxMeasurements={boxMeasurements}
              onDropCat={(catId, coords) => {
                if (coords) {
                  placeCat(catId, coords);
                } else {
                  // Optional: call a dedicated unplace method if available, e.g., unplaceCat(catId)
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