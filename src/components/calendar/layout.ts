import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CELL_GAP = 8;
export const MONTH_H_PADDING = 8;

export const NUM_COLUMNS = 3;

// Square cell: fills the row exactly
export const CELL_SIZE = Math.floor(
  (SCREEN_WIDTH - 2 * MONTH_H_PADDING - (NUM_COLUMNS - 1) * CELL_GAP) / NUM_COLUMNS,
);

// Keep in sync with MonthView title styles
export const MONTH_HEADER_HEIGHT = 64; // marginTop(12) + lineHeight(38) + marginBottom(14)
const MONTH_PADDING_BOTTOM = 32;

// Month heights vary (28–31 days → different row counts at 3 or 4 cols)
export function computeMonthHeight(numRows: number): number {
  return (
    MONTH_HEADER_HEIGHT +
    numRows * CELL_SIZE +
    (numRows - 1) * CELL_GAP +
    MONTH_PADDING_BOTTOM
  );
}
