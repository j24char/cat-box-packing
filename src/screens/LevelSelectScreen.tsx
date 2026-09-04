// src/screens/LevelSelectScreen.tsx

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SAMPLE_LEVELS } from '../models/Level';
import { COLORS, globalStyles } from '../constants/theme';
import { useLevelProgress } from '../hooks/useLevelProgress';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelSelect'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NODE_SIZE = 72;
const ROW_GAP = 108;

export default function LevelSelectScreen({ navigation }: Props) {
  const { progress, isUnlocked, getStars, refresh } = useLevelProgress();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  const nodes = useMemo(
    () =>
      SAMPLE_LEVELS.map((level, index) => {
        const fromLeft = index % 2 === 0;
        const x = fromLeft ? SCREEN_WIDTH * 0.22 - NODE_SIZE / 2 : SCREEN_WIDTH * 0.78 - NODE_SIZE / 2;
        const y = 24 + index * ROW_GAP;
        return { level, x, y, fromLeft };
      }),
    []
  );

  const contentHeight = 48 + SAMPLE_LEVELS.length * ROW_GAP;

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={[globalStyles.container, styles.transparentContainer]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={globalStyles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={[globalStyles.headerTitle, { marginBottom: 0 }]}>Select Level</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.listContainer, { height: contentHeight }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.pathCanvas, { height: contentHeight }]}>
            {nodes.slice(0, -1).map((node, index) => {
              const next = nodes[index + 1];
              const startX = node.x + NODE_SIZE / 2;
              const startY = node.y + NODE_SIZE / 2;
              const endX = next.x + NODE_SIZE / 2;
              const endY = next.y + NODE_SIZE / 2;
              const dx = endX - startX;
              const dy = endY - startY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const unlocked = isUnlocked(next.level.id);

              return (
                <View
                  key={`path-${node.level.id}`}
                  style={[
                    styles.pathSegment,
                    {
                      left: (startX + endX) / 2 - length / 2,
                      top: (startY + endY) / 2 - 4,
                      width: length,
                      height: 8,
                      backgroundColor: unlocked ? COLORS.accentPink : COLORS.cardboardDark,
                      opacity: unlocked ? 0.9 : 0.35,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}

            {nodes.map(({ level, x, y }) => {
              const unlocked = isUnlocked(level.id);
              const stars = getStars(level.id);
              const completed = stars > 0;
              const current = progress.highestUnlocked === level.id && !completed;

              return (
                <TouchableOpacity
                  key={level.id}
                  disabled={!unlocked}
                  onPress={() => navigation.navigate('Game', { levelId: level.id })}
                  activeOpacity={0.85}
                  style={[
                    styles.levelNode,
                    {
                      left: x,
                      top: y,
                      backgroundColor: !unlocked
                        ? COLORS.cardboardDark
                        : completed
                          ? COLORS.accentPink
                          : COLORS.accentYellow,
                      transform: [{ scale: current ? 1.08 : 1 }],
                      borderColor: current ? COLORS.textDark : COLORS.cardboardBorder,
                    },
                  ]}
                >
                  <Text style={styles.levelNumber}>{unlocked ? level.id : '🔒'}</Text>
                  {completed && (
                    <Text style={styles.stars}>
                      {'★'.repeat(stars)}
                      {'☆'.repeat(Math.max(0, 3 - stars))}
                    </Text>
                  )}
                  {unlocked && !completed && (
                    <Text style={styles.levelTitle} numberOfLines={1}>
                      {level.title}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
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
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 40,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  listContainer: {
    width: '100%',
    paddingBottom: 48,
  },
  pathCanvas: {
    width: '100%',
    position: 'relative',
  },
  pathSegment: {
    position: 'absolute',
    borderRadius: 8,
  },
  levelNode: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelNumber: {
    fontFamily: 'Fredoka-Bold',
    fontSize: 20,
    color: COLORS.textDark,
  },
  levelTitle: {
    fontFamily: 'Fredoka-Regular',
    fontSize: 8,
    color: COLORS.textDark,
    textAlign: 'center',
  },
  stars: {
    fontSize: 10,
    color: '#E6A817',
    marginTop: 2,
  },
});