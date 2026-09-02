// src/components/CatSprite.tsx

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { CatBreed, CatPose } from '../models/Cat';

interface CatSpriteProps {
  breed: CatBreed;
  pose: CatPose;
  size?: number;
  width?: number;
  height?: number;
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
  style,
}) => {
  const colors = BREED_COLORS[breed] || BREED_COLORS.orange;
  const canvasWidth = width ?? size;
  const canvasHeight = height ?? size;
  const scale = Math.min(canvasWidth, canvasHeight) / 100;

  const getPosePaths = () => {
    switch (pose) {
      case 'curl': {
        const bodyPath = Skia.Path.Make();
        bodyPath.addCircle(50, 50, 38);

        const ear1 = Skia.Path.Make();
        ear1.moveTo(25, 25);
        ear1.lineTo(35, 12);
        ear1.lineTo(45, 25);
        ear1.close();

        const ear2 = Skia.Path.Make();
        ear2.moveTo(55, 25);
        ear2.lineTo(65, 12);
        ear2.lineTo(75, 25);
        ear2.close();

        return { bodyPath, ears: [ear1, ear2], tail: null };
      }

      case 'stretch': {
        const bodyPath = Skia.Path.Make();
        bodyPath.addOval({ x: 15, y: 35, width: 70, height: 30 });

        const ear1 = Skia.Path.Make();
        ear1.moveTo(70, 35);
        ear1.lineTo(78, 20);
        ear1.lineTo(84, 35);
        ear1.close();

        const ear2 = Skia.Path.Make();
        ear2.moveTo(55, 35);
        ear2.lineTo(62, 20);
        ear2.lineTo(68, 35);
        ear2.close();

        const tail = Skia.Path.Make();
        tail.moveTo(18, 50);
        tail.quadTo(5, 45, 8, 25);

        return { bodyPath, ears: [ear1, ear2], tail };
      }

      case 'sitting': {
        const bodyPath = Skia.Path.Make();
        bodyPath.addOval({ x: 30, y: 40, width: 40, height: 50 });

        const headPath = Skia.Path.Make();
        headPath.addCircle(50, 32, 22);
        bodyPath.addPath(headPath);

        const ear1 = Skia.Path.Make();
        ear1.moveTo(32, 22);
        ear1.lineTo(38, 5);
        ear1.lineTo(46, 20);
        ear1.close();

        const ear2 = Skia.Path.Make();
        ear2.moveTo(54, 20);
        ear2.lineTo(62, 5);
        ear2.lineTo(68, 22);
        ear2.close();

        return { bodyPath, ears: [ear1, ear2], tail: null };
      }

      case 'loaf': {
        const bodyPath = Skia.Path.Make();
        const rrect = Skia.RRectXY({ x: 20, y: 30, width: 60, height: 45 }, 20, 20);
        bodyPath.addRRect(rrect);

        const ear1 = Skia.Path.Make();
        ear1.moveTo(28, 32);
        ear1.lineTo(34, 15);
        ear1.lineTo(42, 32);
        ear1.close();

        const ear2 = Skia.Path.Make();
        ear2.moveTo(58, 32);
        ear2.lineTo(66, 15);
        ear2.lineTo(72, 32);
        ear2.close();

        return { bodyPath, ears: [ear1, ear2], tail: null };
      }

      case 'kitten':
      default: {
        const bodyPath = Skia.Path.Make();
        bodyPath.addCircle(50, 55, 25);

        const headPath = Skia.Path.Make();
        headPath.addCircle(50, 35, 18);
        bodyPath.addPath(headPath);

        const ear1 = Skia.Path.Make();
        ear1.moveTo(35, 25);
        ear1.lineTo(40, 10);
        ear1.lineTo(46, 24);
        ear1.close();

        const ear2 = Skia.Path.Make();
        ear2.moveTo(54, 24);
        ear2.lineTo(60, 10);
        ear2.lineTo(65, 25);
        ear2.close();

        return { bodyPath, ears: [ear1, ear2], tail: null };
      }
    }
  };

  const { bodyPath, ears, tail } = getPosePaths();

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
      <Path path={bodyPath} color={colors.body} />
      {ears.map((earPath, index) => (
        <Path key={index} path={earPath} color={colors.body} />
      ))}
      {ears.map((earPath, index) => (
        <Path key={`inner-${index}`} path={earPath} color={colors.innerEar} opacity={0.6} />
      ))}
    </Canvas>
  );
};

export default CatSprite;