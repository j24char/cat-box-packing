// src/components/BoxTile.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';

interface BoxTileProps {
  rows: number;
  cols: number;
  mask?: number[][];
  tileSize?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const BoxTile: React.FC<BoxTileProps> = ({
  rows,
  cols,
  mask,
  tileSize = 60,
  children,
  style,
}) => {
  const containerWidth = cols * tileSize + 24;
  const containerHeight = rows * tileSize + 24;

  return (
    <View style={[styles.boxContainer, { width: containerWidth, height: containerHeight }, style]}>
      {/* Top Left Cardboard Flap */}
      <View style={[styles.flap, styles.flapTopLeft]} />
      {/* Top Right Cardboard Flap */}
      <View style={[styles.flap, styles.flapTopRight]} />
      
      {/* Inner Box Interior / Grid Container */}
      <View style={styles.gridContainer}>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {Array.from({ length: cols }).map((_, cIdx) => {
              const isPlayable = mask ? mask[rIdx]?.[cIdx] !== 0 : true;

              return (
                <View
                  key={`cell-${rIdx}-${cIdx}`}
                  style={[
                    styles.cell,
                    { width: tileSize, height: tileSize },
                    !isPlayable && styles.blockedCell,
                  ]}
                />
              );
            })}
          </View>
        ))}

        {/* Absolute Children Layer (Cat Pieces Grid Overlay) */}
        {children && <View style={StyleSheet.absoluteFill}>{children}</View>}
      </View>

      {/* Bottom Left Cardboard Flap */}
      <View style={[styles.flap, styles.flapBottomLeft]} />
      {/* Bottom Right Cardboard Flap */}
      <View style={[styles.flap, styles.flapBottomRight]} />
    </View>
  );
};

const styles = StyleSheet.create({
  boxContainer: {
    backgroundColor: COLORS.cardboard,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: COLORS.cardboardBorder,
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  gridContainer: {
    backgroundColor: COLORS.cardboardDark,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardboardBorder,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: COLORS.gridSlotBg,
    borderWidth: 1,
    borderColor: COLORS.gridSlotBorder,
  },
  blockedCell: {
    backgroundColor: COLORS.cardboardDark,
    borderColor: COLORS.cardboardBorder,
  },
  flap: {
    position: 'absolute',
    backgroundColor: COLORS.cardboard,
    borderColor: COLORS.cardboardBorder,
    borderWidth: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  flapTopLeft: {
    top: -16,
    left: -10,
    width: 40,
    height: 20,
    transform: [{ rotate: '-15deg' }],
  },
  flapTopRight: {
    top: -16,
    right: -10,
    width: 40,
    height: 20,
    transform: [{ rotate: '15deg' }],
  },
  flapBottomLeft: {
    bottom: -16,
    left: -10,
    width: 40,
    height: 20,
    transform: [{ rotate: '15deg' }],
  },
  flapBottomRight: {
    bottom: -16,
    right: -10,
    width: 40,
    height: 20,
    transform: [{ rotate: '-15deg' }],
  },
});

export default BoxTile;