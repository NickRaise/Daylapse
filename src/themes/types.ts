export interface ThemeColors {
  // Brand
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Backgrounds
  bg: string;
  bgSurface: string;
  bgElevated: string;
  bgSubtle: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textOnAccent: string;
  textOnAccentDim: string;

  // Borders
  border: string;
  borderFocus: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Calendar
  recordedDay: string;
  missedDay: string;
  today: string;

  // Mood
  moodHappy: string;
  moodCalm: string;
  moodNeutral: string;
  moodSad: string;
  moodAngry: string;

  // Interactive
  ripple: string;
  overlay: string;
  shadow: string;
}

export interface Theme {
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  spacing: {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
    8: number;
    10: number;
    12: number;
    16: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  fontWeight: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}
