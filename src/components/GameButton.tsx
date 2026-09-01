// src/components/GameButton.tsx

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Variant color mappings (Face color, Bevel shadow edge color, Top highlight border)
  const variantColors = {
    primary: {
      topHighlight: '#FFDCD9',
      face: COLORS.accentPink, // #FFB7B2
      shadowEdge: '#E59893',
    },
    secondary: {
      topHighlight: '#FFF5E1',
      face: COLORS.accentYellow, // #FFE5B4
      shadowEdge: '#E6C995',
    },
    accent: {
      topHighlight: '#EBE3FF',
      face: COLORS.accentPurple, // #C7B8EA
      shadowEdge: '#9F8DC7',
    },
  };

  const colors = variantColors[variant];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.outerContainer,
        { opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      {/* 3D Bottom Bevel Base (Static Shadow) */}
      <View
        style={[
          styles.shadowBase,
          { backgroundColor: colors.shadowEdge },
        ]}
      />

      {/* Button Front Face (Moves down when pressed) */}
      <View
        style={[
          styles.buttonFace,
          {
            backgroundColor: colors.face,
            borderTopColor: colors.topHighlight,
            transform: [{ translateY: isPressed ? 4 : 0 }],
          },
        ]}
      >
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    height: 52,
    marginVertical: 8,
    minWidth: 160,
  },
  shadowBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.textDark,
  },
  buttonFace: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderTopWidth: 3,
    borderColor: COLORS.textDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  buttonText: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.textDark,
    textAlign: 'center',
  },
});

export default GameButton;