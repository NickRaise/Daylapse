// Dusk — Dark Moody
// Palette: Dry Sage #c9cba3 · Soft Peach #ffe1a8 · Vibrant Coral #e26d5c · Wine Plum #723d46 · Mauve Shadow #472d30
import type { Theme } from './types';
import { base } from './base';

export const dusk: Theme = {
  name: 'Dusk',
  isDark: true,
  ...base,
  colors: {
    primary:      '#E26D5C',  // Vibrant Coral
    primaryLight: '#EB9387',
    primaryDark:  '#C5503F',

    bg:           '#472D30',  // Mauve Shadow
    bgSurface:    '#5C3940',
    bgElevated:   '#723D46',  // Wine Plum
    bgSubtle:     '#3D2428',

    textPrimary:   '#FFE1A8',  // Soft Peach
    textSecondary: '#C9CBA3',  // Dry Sage
    textMuted:     '#8A7870',
    textDisabled:  '#5C4840',
    textOnAccent:  '#FFFFFF',

    border:      'rgba(255,225,168,0.10)',
    borderFocus: '#E26D5C',

    success: '#C9CBA3',  // Dry Sage
    warning: '#FFE1A8',  // Soft Peach
    error:   '#E26D5C',  // Vibrant Coral
    info:    '#8DA9C4',

    recordedDay: '#C9CBA3',  // Dry Sage
    missedDay:   '#723D46',  // Wine Plum
    today:       '#E26D5C',  // Vibrant Coral

    moodHappy:   '#FFE1A8',
    moodCalm:    '#C9CBA3',
    moodNeutral: '#8A7870',
    moodSad:     '#8DA9C4',
    moodAngry:   '#E26D5C',

    ripple:  'rgba(255,225,168,0.10)',
    overlay: 'rgba(71,45,48,0.60)',
    shadow:  'rgba(0,0,0,0.30)',
  },
};
