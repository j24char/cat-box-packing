// src/components/CatSprite.tsx

import React from 'react';
import { ViewStyle } from 'react-native';
import { Canvas, Path, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import { CatBreed, CatPose } from '../models/Cat';

interface CatSpriteProps {
  breed: CatBreed;
  pose: CatPose;
  size?: number;
  width?: number;
  height?: number;
  shapeMatrix?: number[][];
  style?: ViewStyle;
}

// Color palettes for each breed
const BREED_COLORS: Record<CatBreed, { body: string; detail: string; innerEar: string }> = {
  calico: { body: '#F4A261', detail: '#2A9D8F', innerEar: '#E76F51' },
  tabby: { body: '#A68A64', detail: '#524636', innerEar: '#DDB892' },
  orange: { body: '#F39C12', detail: '#D35400', innerEar: '#FADBD8' },
  silver: { body: '#BDC3C7', detail: '#7F8C8D', innerEar: '#F2D7D5' },
  tuxedo: { body: '#2C3E50', detail: '#ECF0F1', innerEar: '#FADBD8' },
  black: { body: '#212F3D', detail: '#17202A', innerEar: '#5D6D7E' },
  white: { body: '#FDFEFE', detail: '#BDC3C7', innerEar: '#FADBD8' },
};

export const CatSprite: React.FC<CatSpriteProps> = ({
  breed,
  pose,
  size = 60,
  width,
  height,
  shapeMatrix,
  style,
}) => {
  const colors = BREED_COLORS[breed] || BREED_COLORS.orange;
  const canvasWidth = width ?? size;
  const canvasHeight = height ?? size;
  const scale = Math.min(canvasWidth, canvasHeight) / 100;
  const matrix = shapeMatrix ?? getPoseMatrix(pose);
  const rows = matrix.length || 1;
  const cols = matrix[0]?.length || 1;
  const cellWidth = canvasWidth / cols;
  const cellHeight = canvasHeight / rows;

  const getPosePaths = () => {
    switch (pose) {
      case 'curl': {
        return {
          bodyPath: 'M 50,50 m -38,0 a 38,38 0 1,0 76,0 a 38,38 0 1,0 -76,0 Z',
          ears: [
            'M 25 25 L 35 12 L 45 25 Z',
            'M 55 25 L 65 12 L 75 25 Z',
          ],
          tail: null,
          loafRRect: null,
        };
      }

      case 'stretch': {
        return {
          bodyPath: 'M 15 50 A 35 15 0 1 0 85 50 A 35 15 0 1 0 15 50 Z',
          ears: [
            'M 70 35 L 78 20 L 84 35 Z',
            'M 55 35 L 62 20 L 68 35 Z',
          ],
          tail: 'M 18 50 Q 5 45 8 25',
          loafRRect: null,
        };
      }

      case 'sitting': {
        return {
          bodyPath: 'M 30 65 A 20 25 0 1 0 70 65 A 20 25 0 1 0 30 65 Z M 28 32 A 22 22 0 1 0 72 32 A 22 22 0 1 0 28 32 Z',
          ears: [
            'M 32 22 L 38 5 L 46 20 Z',
            'M 54 20 L 62 5 L 68 22 Z',
          ],
          tail: null,
          loafRRect: null,
        };
      }

      case 'loaf': {
        return {
          bodyPath: '',
          ears: [
            'M 28 32 L 34 15 L 42 32 Z',
            'M 58 32 L 66 15 L 72 32 Z',
          ],
          tail: null,
          loafRRect: rrect(rect(20, 30, 60, 45), 20, 20),
        };
      }

      case 'standing': {
        return {
          bodyPath: 'M 30 50 A 20 30 0 1 0 70 50 A 20 30 0 1 0 30 50 Z M 30 18 A 20 20 0 1 0 70 18 A 20 20 0 1 0 30 18 Z',
          ears: [
            'M 34 10 L 40 -4 L 48 10 Z',
            'M 52 10 L 60 -4 L 66 10 Z',
          ],
          tail: 'M 35 70 Q 15 75 12 55',
          loafRRect: null,
        };
      }

      case 'kitten':
      default: {
        return {
          bodyPath: 'M 25 55 A 25 25 0 1 0 75 55 A 25 25 0 1 0 25 55 Z M 32 35 A 18 18 0 1 0 68 35 A 18 18 0 1 0 32 35 Z',
          ears: [
            'M 35 25 L 40 10 L 46 24 Z',
            'M 54 24 L 60 10 L 65 25 Z',
          ],
          tail: null,
          loafRRect: null,
        };
      }
    }
  };

  const { bodyPath, ears, tail, loafRRect } = getPosePaths();
  const cellRects = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (matrix[row]?.[col] !== 1) continue;

      const cellRRect = rrect(
        rect(
          col * cellWidth + 2,
          row * cellHeight + 2,
          Math.max(cellWidth - 4, 2),
          Math.max(cellHeight - 4, 2)
        ),
        10,
        10
      );

      cellRects.push(cellRRect);
    }
  }

  return (
    <Canvas style={[{ width: canvasWidth, height: canvasHeight }, style]}>
      {tail && (
        <Path
          path={tail}
          color={colors.detail}
          style="stroke"
          strokeWidth={6 * scale}
        />
      )}
      {cellRects.length > 0 ? (
        <>
          {cellRects.map((cellRRect, index) => (
            <RoundedRect key={`cell-${index}`} rect={cellRRect} color={colors.body} opacity={0.96} />
          ))}
          {cellRects.map((cellRRect, index) => (
            <RoundedRect key={`cell-inner-${index}`} rect={cellRRect} color={colors.innerEar} opacity={0.22} />
          ))}
        </>
      ) : (
        <>
          {loafRRect ? (
            <RoundedRect rect={loafRRect} color={colors.body} />
          ) : (
            <Path path={bodyPath} color={colors.body} />
          )}
          {ears.map((earPath, index) => (
            <Path key={index} path={earPath} color={colors.body} />
          ))}
          {ears.map((earPath, index) => (
            <Path key={`inner-${index}`} path={earPath} color={colors.innerEar} opacity={0.6} />
          ))}
        </>
      )}
    </Canvas>
  );
};

const getPoseMatrix = (pose: CatPose): number[][] => {
  switch (pose) {
    case 'curl':
      return [[1, 1], [1, 1]];
    case 'stretch':
      return [[1, 1, 1], [1, 0, 0]];
    case 'sitting':
      return [[1, 1]];
    case 'loaf':
      return [[1, 1, 1, 1]];
    case 'standing':
      return [[1, 1], [1, 1], [1, 1]];
    case 'kitten':
    default:
      return [[1]];
  }
};

export default CatSprite;