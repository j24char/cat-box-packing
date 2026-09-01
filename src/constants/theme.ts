import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const COLORS = {
  primaryBg: '#FDF6E2',       // Warm cream background
  cardboard: '#D4A373',       // Cardboard brown
  cardboardDark: '#A97443',   // Shadow brown
  accentPink: '#FFB7B2',      // Pastel pink for UI buttons
  accentYellow: '#FFE5B4',    // Warm yellow highlight
  textDark: '#4A3E3D',        // Dark chocolate text
  textLight: '#FFFFFF',
  gridBorder: '#C19A6B',
  shadowColor: '#000000',
  gridSlotBg: '#E0C097',          // Light beige for grid slots
  gridSlotBorder: '#BFA17A',      // Slightly darker beige for grid slot borders
  cardboardBorder: '#B07D4F',      // Slightly darker brown for borders
  primaryBgDark: '#E6D5B8',      // Slightly darker cream for contrast
  textMuted: '#7D6E6A',         // Muted brown for secondary text
  accentPurple: '#C7B8EA',      // Soft purple for accent elements
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONTS = {
  title: 'Fredoka-Bold',       // Soft, rounded cartoon font
  body: 'Fredoka-Regular',
};

export const SHADOWS = StyleSheet.create({
  button: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  card: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

interface ThemeStyles {
  container: ViewStyle;
  headerTitle: TextStyle;
  menuCard: ViewStyle;
  primaryButton: ViewStyle;
  primaryButtonText: TextStyle;
  iconButton: ViewStyle;
}

export const globalStyles = StyleSheet.create<ThemeStyles>({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.title,
    fontSize: 28,
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  menuCard: {
    backgroundColor: COLORS.cardboard,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 4,
    borderColor: COLORS.cardboardDark,
    ...SHADOWS.card,
  },
  primaryButton: {
    backgroundColor: COLORS.accentPink,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.textDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    ...SHADOWS.button,
  },
  primaryButtonText: {
    fontFamily: FONTS.title,
    fontSize: 18,
    color: COLORS.textDark,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.textDark,
  },
});