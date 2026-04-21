import { TextStyle } from 'react-native';

export const FontFamilies = {
  // Manrope - Display & Headlines
  manrope: 'Manrope',
  manropeBold: 'Manrope_700Bold',
  manropeExtraBold: 'Manrope_800ExtraBold',

  // Inter - Body & Titles
  inter: 'Inter',
  interMedium: 'Inter_500Medium',
  interSemiBold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',

  // Space Grotesk - Labels & Metadata
  spaceGrotesk: 'SpaceGrotesk',
  spaceGroteskMedium: 'SpaceGrotesk_500Medium',
  spaceGroteskBold: 'SpaceGrotesk_700Bold',

  // System fallbacks
  system: 'System',
};

export const Typography = {
  displayLg: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.6,
    fontWeight: '800' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  displayMd: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1.2,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  headlineLg: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  titleLg: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  titleMd: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  bodySm: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  labelLg: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  labelMd: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.4,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.0,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily: FontFamilies.system,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
};
