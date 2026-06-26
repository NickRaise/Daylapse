// Vanilla — Warm Olive
// Palette: Vanilla Cream #f0ead2 · Cream #dde5b6 · Muted Olive #adc178 · Faded Copper #a98467 · Ash Brown #6c584c
import type { Theme } from './types';
import { base } from './base';

export const vanilla: Theme = {
  name: 'Vanilla',
  isDark: false,
  ...base,
  colors: {
    primary:      '#A98467',  // Faded Copper
    primaryLight: '#C4A387',
    primaryDark:  '#8C6B4F',

    bg:           '#F0EAD2',  // Vanilla Cream
    bgSurface:    '#FAFAF2',
    bgElevated:   '#DDE5B6',  // Cream
    bgSubtle:     '#E8EDD0',

    textPrimary:   '#6C584C',  // Ash Brown
    textSecondary: '#8A7465',
    textMuted:     '#A89080',
    textDisabled:  '#C8B8A8',
    textOnAccent:  '#FFFFFF',

    border:      '#D4CCB0',
    borderFocus: '#A98467',

    success: '#ADC178',  // Muted Olive
    warning: '#C4A467',
    error:   '#C47060',
    info:    '#7AAFC4',

    recordedDay: '#ADC178',  // Muted Olive
    missedDay:   '#DDE5B6',  // Cream
    today:       '#A98467',  // Faded Copper

    moodHappy:   '#E2C97E',
    moodCalm:    '#ADC178',
    moodNeutral: '#C8C4B0',
    moodSad:     '#8FB8C8',
    moodAngry:   '#C47060',

    ripple:  'rgba(108,88,76,0.08)',
    overlay: 'rgba(108,88,76,0.25)',
    shadow:  'rgba(0,0,0,0.07)',
  },
};
