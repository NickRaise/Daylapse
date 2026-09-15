// Olive — Earthy Green (matches the app icon)
// Palette: Deep Olive #5B6B54 · Sage Mist #8A9A7B · Olive Cream #F2F0DE · Warm Gold #D9B45C · Charcoal Olive #2E3328
import type { Theme } from './types';
import { base } from './base';

export const olive: Theme = {
  name: 'Olive',
  isDark: false,
  ...base,
  colors: {
    primary:      '#5B6B54',  // Deep Olive
    primaryLight: '#8A9A7B',  // Sage Mist
    primaryDark:  '#3F4A3A',

    bg:           '#F2F0DE',  // Olive Cream
    bgSurface:    '#FFFFFF',
    bgElevated:   '#DCE0C8',
    bgSubtle:     '#E8E6D2',

    textPrimary:   '#2E3328',  // Charcoal Olive
    textSecondary: '#5C6653',
    textMuted:     '#7A8370',
    textDisabled:  '#ABB29E',
    textOnAccent:    '#FFFFFF',
    textOnAccentDim: 'rgba(255,255,255,0.65)',

    placeholderPrimary: '#748067',
    placeholderSecondary: '#9AA28C',

    border:      '#D8D6BE',
    borderFocus: '#8A9A7B',
    borderDark:  '#2E3328',

    success: '#7A9A6A',
    warning: '#D9B45C',  // Warm Gold
    error:   '#B0453E',
    info:    '#8DA9C4',

    recordedDay: '#8A9A7B',  // Sage Mist
    missedDay:   '#DCE0C8',
    today:       '#D9B45C',  // Warm Gold

    moodHappy:   '#D9B45C',
    moodCalm:    '#8A9A7B',
    moodNeutral: '#C8C4AE',
    moodSad:     '#8DA9C4',
    moodAngry:   '#C47060',

    ripple:  'rgba(46,51,40,0.08)',
    overlay: 'rgba(46,51,40,0.25)',
    shadow:  'rgba(0,0,0,0.08)',
  },
};
