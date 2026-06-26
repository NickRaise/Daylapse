// Blossom — Dreamy Pastels
// Palette: Pink Orchid #cdb4db · Pastel Petal #ffc8dd · Blush Pop #ffafcc · Icy Blue #bde0fe · Sky Blue #a2d2ff
import type { Theme } from './types';
import { base } from './base';

export const blossom: Theme = {
  name: 'Blossom',
  isDark: false,
  ...base,
  colors: {
    primary:      '#FFAFCC',  // Blush Pop
    primaryLight: '#FFD0E3',
    primaryDark:  '#E888AA',

    bg:           '#FFF5F9',  // near-white blush tint
    bgSurface:    '#FFFFFF',
    bgElevated:   '#FFC8DD',  // Pastel Petal
    bgSubtle:     '#BDE0FE',  // Icy Blue

    textPrimary:   '#4A2545',
    textSecondary: '#7A5070',
    textMuted:     '#AA8098',
    textDisabled:  '#D4B8CA',
    textOnAccent:    '#FFFFFF',
    textOnAccentDim: 'rgba(255,255,255,0.65)',

    border:      'rgba(205,180,219,0.5)',  // Pink Orchid tint
    borderFocus: '#FFAFCC',

    success: '#A8D8B0',
    warning: '#FFD9A0',
    error:   '#E8889A',
    info:    '#A2D2FF',  // Sky Blue

    recordedDay: '#CDB4DB',  // Pink Orchid
    missedDay:   '#BDE0FE',  // Icy Blue
    today:       '#FFAFCC',  // Blush Pop

    moodHappy:   '#FFD966',
    moodCalm:    '#BDE0FE',
    moodNeutral: '#CDB4DB',
    moodSad:     '#A2D2FF',
    moodAngry:   '#E8889A',

    ripple:  'rgba(74,37,69,0.08)',
    overlay: 'rgba(74,37,69,0.20)',
    shadow:  'rgba(0,0,0,0.06)',
  },
};
