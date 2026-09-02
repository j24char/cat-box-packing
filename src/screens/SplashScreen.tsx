// src/screens/SplashScreen.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { CatSprite } from '../components/CatSprite';
import { COLORS, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrances animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing/floating loop for title box
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto navigate after splash delay if handler provided
    if (onFinish) {
      const timer = setTimeout(onFinish, 2800);
      return () => clearTimeout(timer);
    }
  }, [fadeAnim, scaleAnim, floatAnim, onFinish]);

  return (
    <View style={styles.container}>
      {/* Background Pastel Wallpaper Stripes */}
      <View style={styles.stripeBackground}>
        <View style={[styles.stripe, { backgroundColor: '#FAD2E1' }]} />
        <View style={[styles.stripe, { backgroundColor: '#FFE5EC' }]} />
        <View style={[styles.stripe, { backgroundColor: '#D8E2DC' }]} />
        <View style={[styles.stripe, { backgroundColor: '#ECE4DB' }]} />
        <View style={[styles.stripe, { backgroundColor: '#FFE5D9' }]} />
      </View>

      {/* Main Center Cardboard Box Frame */}
      <Animated.View
        style={[
          styles.mainCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
          },
        ]}
      >
        {/* Sleeping Cats Visual Grouping */}
        <View style={styles.catCluster}>
          <CatSprite
            breed="calico"
            pose="curl"
            size={80}
            style={styles.leftCat}
          />
          <CatSprite
            breed="tabby"
            pose="loaf"
            size={90}
            style={styles.centerCat}
          />
          <CatSprite
            breed="black"
            pose="stretch"
            size={85}
            style={styles.rightCat}
          />
        </View>

        {/* Title Typography */}
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, styles.titleOutline]}>
            CAT BOX
          </Text>
          <Text style={styles.titleText}>CAT BOX</Text>

          <Text style={[styles.subTitleText, styles.subTitleOutline]}>
            PACKING
          </Text>
          <Text style={styles.subTitleText}>PACKING</Text>
        </View>

        {/* Cardboard Box Flaps Accent */}
        <View style={[styles.flap, styles.flapLeft]} />
        <View style={[styles.flap, styles.flapRight]} />
      </Animated.View>

      {/* Loading Bar Footer */}
      <Animated.View style={[styles.footerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>Zzz... Packing sleepy cats...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stripeBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    opacity: 0.45,
  },
  stripe: {
    flex: 1,
    height: '100%',
  },
  mainCard: {
    width: width * 0.82,
    backgroundColor: COLORS.cardboard,
    borderRadius: 24,
    borderWidth: 5,
    borderColor: COLORS.cardboardBorder,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  catCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 16,
    height: 100,
    width: '100%',
  },
  leftCat: {
    transform: [{ rotate: '-12deg' }],
    marginRight: -15,
  },
  centerCat: {
    zIndex: 2,
  },
  rightCat: {
    transform: [{ rotate: '10deg' }],
    marginLeft: -15,
  },
  titleContainer: {
    alignItems: 'center',
    position: 'relative',
    marginTop: 8,
  },
  titleText: {
    fontFamily: FONTS.title,
    fontSize: 38,
    color: '#FF8A8A', // Pastel red/pink bubble title
    textAlign: 'center',
    lineHeight: 44,
  },
  titleOutline: {
    position: 'absolute',
    color: COLORS.textDark,
    top: 3,
    left: 0,
    right: 0,
  },
  subTitleText: {
    fontFamily: FONTS.title,
    fontSize: 34,
    color: '#FFC857', // Warm pastel yellow text
    textAlign: 'center',
    lineHeight: 40,
  },
  subTitleOutline: {
    position: 'absolute',
    color: COLORS.textDark,
    top: 3,
    left: 0,
    right: 0,
  },
  flap: {
    position: 'absolute',
    backgroundColor: COLORS.cardboard,
    borderColor: COLORS.cardboardBorder,
    borderWidth: 4,
    borderRadius: 8,
    width: 50,
    height: 24,
  },
  flapLeft: {
    top: -16,
    left: 20,
    transform: [{ rotate: '-20deg' }],
  },
  flapRight: {
    top: -16,
    right: 20,
    transform: [{ rotate: '20deg' }],
  },
  footerContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
});

export default SplashScreen;