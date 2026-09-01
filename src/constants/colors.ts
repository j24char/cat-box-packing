// src/constants/colors.ts

export const COLORS = {
  // Main Canvas & Layout
  primaryBg: '#FDF6E2',        // Soft cream backdrop matching wallpaper/mats
  primaryBgDark: '#F3E5C8',    // Slightly deeper cream for container borders/dividers
  cardboard: '#D4A373',        // Main box brown
  cardboardDark: '#A97443',    // Darker brown for box interior shadows & walls
  cardboardBorder: '#8B5E34',  // Deep outline for cardboard flaps

  // UI Buttons & Headers
  accentPink: '#FFB7B2',       // UI buttons (Undo, Back, Reset)
  accentYellow: '#FFE5B4',     // Action highlights (Hint, Selected states)
  accentPurple: '#C7B8EA',     // Secondary UI elements & home buttons
  accentGreen: '#E2F0CB',      // Success / Level completed state

  // Typography & Borders
  textDark: '#4A3E3D',         // Soft dark chocolate for primary text
  textLight: '#FFFFFF',        // White text for dark button backgrounds
  textMuted: '#8A7A78',        // Subtitle & move counter text
  borderDark: '#3A2E2B',       // Vector line work and dark outlines

  // Game Grid & Drop Targets
  gridSlotBg: '#E8D2B8',       // Empty grid slot inside cardboard box
  gridSlotBorder: '#C19A6B',   // Grid cell divider line
  targetHighlight: '#FFD166',  // Glow when dragging cat over valid slot
  invalidHighlight: '#FF6B6B', // Red tint when attempting invalid drop

  // Utility Shadows
  shadowColor: '#2B1A17',
} as const;

export type ColorKey = keyof typeof COLORS;