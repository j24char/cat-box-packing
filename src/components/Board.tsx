// src/components/Board.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BoxTile } from './BoxTile';
import { BoxGridConfig } from '../models/Level';

interface BoardProps {
  gridConfig: BoxGridConfig;
  tileSize?: number;
  onGridMeasured?: (measurements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export const Board: React.FC<BoardProps> = ({
  gridConfig,
  tileSize = 60,
  onGridMeasured,
}) => {
  return (
    <View style={styles.container}>
      <BoxTile
        rows={gridConfig.rows}
        cols={gridConfig.cols}
        mask={gridConfig.mask}
        obstacles={gridConfig.obstacles}
        tileSize={tileSize}
        onGridMeasured={onGridMeasured}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
});

export default Board;
