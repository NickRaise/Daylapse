// Sage — Earthy Warm
// Palette: Dry Sage #ccd5ae · Beige #e9edc9 · Cornsilk #fefae0 · Papaya Whip #faedcd · Light Bronze #d4a373
import type { Theme } from './types';
import { base } from './base';

export const sage: Theme = {
  name: 'Sage',
  isDark: false,
  ...base,
  colors: {
    primary:      '#D4A373',  // Light Bronze
    primaryLight: '#E7C7A6',
    primaryDark:  '#B88758',

    bg:           '#FEFAE0',  // Cornsilk
    bgSurface:    '#FFFFFF',
    bgElevated:   '#FAEDCD',  // Papaya Whip
    bgSubtle:     '#E9EDC9',  // Beige

    textPrimary:   '#3F3428',
    textSecondary: '#6F6558',
    textMuted:     '#9B9288',
    textDisabled:  '#C5BEB5',
    textOnAccent:  '#FFFFFF',

    border:      '#E4DFC8',
    borderFocus: '#D4A373',

    success: '#88A97A',
    warning: '#D4A373',
    error:   '#D97A6C',
    info:    '#8DA9C4',

    recordedDay: '#CCD5AE',  // Dry Sage
    missedDay:   '#E9EDC9',  // Beige
    today:       '#D4A373',  // Light Bronze

    moodHappy:   '#F4D35E',
    moodCalm:    '#CCD5AE',
    moodNeutral: '#D6D3C4',
    moodSad:     '#A8C7E6',
    moodAngry:   '#D97A6C',

    ripple:  'rgba(63,52,40,0.08)',
    overlay: 'rgba(63,52,40,0.25)',
    shadow:  'rgba(0,0,0,0.08)',
  },
};
