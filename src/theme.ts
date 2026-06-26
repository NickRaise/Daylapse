export const colors = {
  // Brand
  primary:        '#FF6B35',
  primaryDim:     '#CC5028',

  // Backgrounds
  bg:             '#000000',
  bgSurface:      '#1A1A1A',
  bgElevated:     '#242424',
  bgSubtle:       '#0C0C0C',

  // Text
  textPrimary:    '#EBEBEB',
  textSecondary:  '#888888',
  textMuted:      '#444444',
  textDisabled:   '#252525',
  textOnAccent:   '#FFFFFF',

  // Borders
  border:         'rgba(255,255,255,0.08)',
  borderFocus:    'rgba(255,255,255,0.20)',

  // Interactive
  ripple:         'rgba(255,255,255,0.12)',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
} as const;

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 30,
  '3xl': 36,
} as const;
