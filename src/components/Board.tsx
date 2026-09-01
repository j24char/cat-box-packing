// src/components/Board.tsx

import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BoxTile } from './BoxTile';
import { BoxGridConfig } from '../models/Level';

interface BoardProps {
  gridConfig: BoxGridConfig;
  tileSize?: number;
  onLayoutMeasured?: (measurements: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export const Board: React.FC<BoardProps> = ({
  gridConfig,
  tileSize = 60,
  onLayoutMeasured,
}) => {
  const containerRef = useRef<View>(null);

  const handleLayout = () => {
    containerRef.current?.measureInWindow((x, y, width, height) => {
      onLayoutMeasured?.({ x, y, width, height });
    });
  };

  return (
    <View
      ref={containerRef}
      style={styles.container}
      onLayout={handleLayout}
    >
      <BoxTile
        rows={gridConfig.rows}
        cols={gridConfig.cols}
        mask={gridConfig.mask}
        tileSize={tileSize}
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