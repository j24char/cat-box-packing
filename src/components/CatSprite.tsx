// src/components/CatSprite.tsx

import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { CatBreed, CatPose } from '../models/Cat';

interface CatSpriteProps {
  breed: CatBreed;
  pose: CatPose;
  size?: number;
  width?: number;
  height?: number;
  shapeMatrix?: number[][];
  rotation?: number; // 0, 90, 180, 270
  style?: ViewStyle;
  imageSource?: ImageSourcePropType;
}

// Map breed names from model to image filename naming convention
const BREED_NAME_MAP: Record<string, string> = {
  calico: 'Calico',
  black: 'Black',
  silver: 'Gray',
  gray: 'Gray',
  tabby: 'Tabby',
  siamese: 'Siamese',
  tuxedo: 'Tuxedo',
  orange: 'Tabby',
  white: 'Calico',
};

// Map poses to image prefix templates
const POSE_NAME_MAP: Record<CatPose, string> = {
  curl: 'Sleeping',
  stretch: 'Stretching',
  sitting: 'Sitting',
  loaf: 'Loaf',
  standing: 'Standing',
  kitten: 'Sitting',
};

// Dictionary matching exact image filenames
const CAT_IMAGE_REGISTRY: Record<string, ImageSourcePropType> = {
  // Calico
  SleepingCalico: require('../../assets/images/cats/SleepingCalico.png'),
  StretchingCalico: require('../../assets/images/cats/StretchingCalico.png'),
  SittingCalico: require('../../assets/images/cats/SittingCalico.png'),
  LoafCalico: require('../../assets/images/cats/LoafCalico.png'),
  StandingCalico: require('../../assets/images/cats/StandingCalico.png'),

  // Black
  SleepingBlack: require('../../assets/images/cats/SleepingBlack.png'),
  StretchingBlack: require('../../assets/images/cats/StretchingBlack.png'),
  SittingBlack: require('../../assets/images/cats/SittingBlack.png'),
  LoafBlack: require('../../assets/images/cats/LoafBlack.png'),
  StandingBlack: require('../../assets/images/cats/StandingBlack.png'),

  // Gray
  SleepingGray: require('../../assets/images/cats/SleepingGray.png'),
  StretchingGray: require('../../assets/images/cats/StretchingGray.png'),
  SittingGray: require('../../assets/images/cats/SittingGray.png'),
  LoafGray: require('../../assets/images/cats/LoafGray.png'),
  StandingGray: require('../../assets/images/cats/StandingGray.png'),

  // Tabby
  SleepingTabby: require('../../assets/images/cats/SleepingTabby.png'),
  StretchingTabby: require('../../assets/images/cats/StretchingTabby.png'),
  SittingTabby: require('../../assets/images/cats/SittingTabby.png'),
  LoafTabby: require('../../assets/images/cats/LoafTabby.png'),
  StandingTabby: require('../../assets/images/cats/StandingTabby.png'),

  // Siamese
  SleepingSiamese: require('../../assets/images/cats/SleepingSiamese.png'),
  StretchingSiamese: require('../../assets/images/cats/StretchingSiamese.png'),
  SittingSiamese: require('../../assets/images/cats/SittingSiamese.png'),
  LoafSiamese: require('../../assets/images/cats/LoafSiamese.png'),
  StandingSiamese: require('../../assets/images/cats/StandingSiamese.png'),

  // Tuxedo
  SleepingTuxedo: require('../../assets/images/cats/SleepingTuxedo.png'),
  StretchingTuxedo: require('../../assets/images/cats/StretchingTuxedo.png'),
  SittingTuxedo: require('../../assets/images/cats/SittingTuxedo.png'),
  LoafTuxedo: require('../../assets/images/cats/LoafTuxedo.png'),
  StandingTuxedo: require('../../assets/images/cats/StandingTuxedo.png'),
};

export const CatSprite: React.FC<CatSpriteProps> = ({
  breed,
  pose,
  size = 60,
  width,
  height,
  rotation = 0,
  style,
  imageSource,
}) => {
  const canvasWidth = width ?? size;
  const canvasHeight = height ?? size;

  const posePrefix = POSE_NAME_MAP[pose] || 'Sitting';
  const breedName = BREED_NAME_MAP[breed] || 'Calico';
  const imageKey = `${posePrefix}${breedName}`;

  const source =
    imageSource || CAT_IMAGE_REGISTRY[imageKey] || CAT_IMAGE_REGISTRY.SittingCalico;

  const isKitten = pose === 'kitten';
  const isLoaf = pose === 'loaf';
  const scale = isKitten ? 0.8 : isLoaf ? 2.9 : 1.0;

  return (
    <View style={[styles.container, { width: canvasWidth, height: canvasHeight }, style]}>
      <Image
        source={source}
        style={[
          styles.catImage,
          {
            transform: [
              { rotate: `${rotation}deg` },
              { scale },
            ],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  catImage: {
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
});

export default CatSprite;