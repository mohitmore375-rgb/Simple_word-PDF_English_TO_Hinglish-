// Precision Lab Color Palette - Dark & Light Themes

export const DarkColors = {
  // Surface hierarchy
  surface: '#0b1326',
  surfaceContainer: '#171f33',
  surfaceContainerHigh: '#222a3d',
  surfaceContainerHighest: '#2d3449',
  surfaceContainerLow: '#131929',
  surfaceContainerLowest: '#0d1220',

  // Primary accent - Orange
  primary: '#FF6B00',
  primaryLight: '#FF8C33',
  primaryDark: '#CC5500',
  primaryContainer: '#FF6B00',
  onPrimary: '#FFFFFF',

  // Secondary accent - Purple/Violet
  secondary: '#d2bbff',
  secondaryContainer: '#4a3f6b',
  onSecondary: '#1a1040',

  // Text hierarchy
  onSurface: '#E8EAF0',
  onSurfaceVariant: '#9BA3B8',
  onSurfaceDim: '#5A6380',

  // Status
  error: '#FF5252',
  errorContainer: '#3D1010',
  success: '#4CAF50',
  successContainer: '#1B3320',
  warning: '#FFC107',

  // Utility
  outline: '#3b494c',
  outlineVariant: 'rgba(59, 73, 76, 0.15)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Tab bar
  tabActive: '#FF6B00',
  tabInactive: '#5A6380',
};

export const LightColors = {
  // Surface hierarchy
  surface: '#F5F6FA',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#ECEEF5',
  surfaceContainerHighest: '#E0E3EE',
  surfaceContainerLow: '#F0F2F8',
  surfaceContainerLowest: '#FAFAFA',

  // Primary accent - Orange
  primary: '#E85B00',
  primaryLight: '#FF6B00',
  primaryDark: '#B84700',
  primaryContainer: '#E85B00',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#6750A4',
  secondaryContainer: '#E8E0FF',
  onSecondary: '#FFFFFF',

  // Text hierarchy
  onSurface: '#1A1C2E',
  onSurfaceVariant: '#44485C',
  onSurfaceDim: '#767A90',

  // Status
  error: '#D32F2F',
  errorContainer: '#FDECEA',
  success: '#388E3C',
  successContainer: '#E8F5E9',
  warning: '#F57C00',

  // Utility
  outline: '#C5C8D8',
  outlineVariant: 'rgba(197, 200, 216, 0.3)',
  scrim: 'rgba(0, 0, 0, 0.4)',

  // Tab bar
  tabActive: '#E85B00',
  tabInactive: '#767A90',
};

export type ColorScheme = typeof DarkColors;
