// Shared structural tokens — identical across all themes.
// Only colors change per theme.
import type { Theme } from './types';

export const base: Omit<Theme, 'name' | 'isDark' | 'colors'> = {
  radius: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
    full: 9999,
  },
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
