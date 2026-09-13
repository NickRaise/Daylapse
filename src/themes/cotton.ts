// Cotton — Soft Muted
// Palette: Cherry Blossom #edafb8 · Powder Petal #f7e1d7 · Dust Grey #dedbd2 · Ash Grey #b0c4b1 · Iron Grey #4a5759
import type { Theme } from './types';
import { base } from './base';

export const cotton: Theme = {
  name: 'Cotton',
  isDark: false,
  ...base,
  colors: {
    primary:      '#AB5865',  // Deep Cherry
    primaryLight: '#EDAFB8',
    primaryDark:  '#8E4A55',

    bg:           '#FAF5F2',  // warm near-white
    bgSurface:    '#FFFFFF',
    bgElevated:   '#F7E1D7',  // Powder Petal
    bgSubtle:     '#DEDBD2',  // Dust Grey

    textPrimary:   '#4A5759',  // Iron Grey
    textSecondary: '#4E6264',
    textMuted:     '#697C7E',
    textDisabled:  '#C4CCCD',
    textOnAccent:    '#FFFFFF',
    textOnAccentDim: 'rgba(255,255,255,0.65)',

    placeholderPrimary: '#7E8F91',
    placeholderSecondary: '#A5B3B4',

    border:      'rgba(126,150,128,0.55)',
    borderFocus: '#EDAFB8',
    borderDark:  '#4A5759',

    success: '#B0C4B1',  // Ash Grey (green cast)
    warning: '#F0C490',
    error:   '#B0453E',  // Clay Red
    info:    '#A8C4D4',

    recordedDay: '#EDAFB8',  // Cherry Blossom
    missedDay:   '#DEDBD2',  // Dust Grey
    today:       '#EDAFB8',  // Cherry Blossom

    moodHappy:   '#F4D98A',
    moodCalm:    '#B0C4B1',
    moodNeutral: '#DEDBD2',
    moodSad:     '#A8C4D4',
    moodAngry:   '#E8A0A8',

    ripple:  'rgba(74,87,89,0.08)',
    overlay: 'rgba(74,87,89,0.20)',
    shadow:  'rgba(0,0,0,0.06)',
  },
};
