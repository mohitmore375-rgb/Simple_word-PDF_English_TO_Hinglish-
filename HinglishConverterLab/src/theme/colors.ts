// Simplae Word — Gemini-Style Color Palette

export const DarkColors = {
  // Backgrounds
  surface: '#0F1117',
  surfaceContainer: '#1A1D27',
  surfaceContainerHigh: '#22263A',
  surfaceContainerHighest: '#2A2F45',
  surfaceContainerLow: '#141720',
  surfaceContainerLowest: '#0C0E16',

  // Primary — Electric Violet/Blue (Gemini-dark style)
  primary: '#8AB4F8',
  primaryLight: '#AFC8FF',
  primaryDark: '#5E8EE0',
  primaryContainer: '#1E3A5F',
  onPrimary: '#001D36',

  // Secondary
  secondary: '#C9BBF5',
  secondaryContainer: '#3A2F6E',
  onSecondary: '#1A1040',

  // Accent
  accent: '#FF8AB4',
  accentLight: '#FFB3CC',

  // Text hierarchy
  onSurface: '#E4E7F0',
  onSurfaceVariant: '#9BA3BC',
  onSurfaceDim: '#545E78',

  // Status
  error: '#FF5252',
  errorContainer: '#3D1010',
  success: '#4CAF50',
  successContainer: '#1B3320',
  warning: '#FFC107',

  // Utility
  outline: '#2E3452',
  outlineVariant: 'rgba(46, 52, 82, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  divider: 'rgba(255,255,255,0.06)',

  // Chat bubbles
  userBubble: '#1E3A5F',
  aiBubble: '#1A1D27',
  userBubbleText: '#E4E7F0',
  aiBubbleText: '#C9CCE0',

  // Input
  inputBackground: '#1A1D27',
  inputBorder: '#2E3452',
  placeholderText: '#545E78',

  // Card
  cardBackground: '#1A1D27',
  cardBorder: 'rgba(46, 52, 82, 0.8)',

  // Tab bar
  tabActive: '#8AB4F8',
  tabInactive: '#545E78',
  tabBarBg: '#131720',
};

export const LightColors = {
  // Backgrounds — Gemini-style soft white/gray
  surface: '#F0F2FA',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#E8EAF6',
  surfaceContainerHighest: '#DDE0F0',
  surfaceContainerLow: '#F5F6FD',
  surfaceContainerLowest: '#FAFBFF',

  // Primary — Gemini Blue-Violet
  primary: '#1A73E8',
  primaryLight: '#4D97F5',
  primaryDark: '#0D47A1',
  primaryContainer: '#E8F0FE',
  onPrimary: '#FFFFFF',

  // Secondary
  secondary: '#6750A4',
  secondaryContainer: '#EDE7F6',
  onSecondary: '#FFFFFF',

  // Accent
  accent: '#E91E8C',
  accentLight: '#F48FB1',

  // Text hierarchy
  onSurface: '#1A1C2E',
  onSurfaceVariant: '#44485E',
  onSurfaceDim: '#767A96',

  // Status
  error: '#D32F2F',
  errorContainer: '#FDECEA',
  success: '#388E3C',
  successContainer: '#E8F5E9',
  warning: '#F57C00',

  // Utility
  outline: '#C4C7D8',
  outlineVariant: 'rgba(196, 199, 216, 0.4)',
  scrim: 'rgba(0, 0, 0, 0.4)',
  divider: 'rgba(0,0,0,0.06)',

  // Chat bubbles
  userBubble: '#E8F0FE',
  aiBubble: '#FFFFFF',
  userBubbleText: '#1A1C2E',
  aiBubbleText: '#1A1C2E',

  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#C4C7D8',
  placeholderText: '#9EA3BE',

  // Card
  cardBackground: '#FFFFFF',
  cardBorder: 'rgba(196, 199, 216, 0.6)',

  // Tab bar
  tabActive: '#1A73E8',
  tabInactive: '#767A96',
  tabBarBg: '#FFFFFF',
};

export type ColorScheme = typeof DarkColors;
