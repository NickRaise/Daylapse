import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DayCell from './DayCell';
import { colors, fontSize, spacing } from '../../theme';
import {
  NUM_COLUMNS,
  CELL_GAP,
  MONTH_H_PADDING,
} from './layout';
import {
  buildDayRows,
  formatDateKey,
  getWeekdayAbbr,
  MONTH_NAMES,
  type MonthData,
} from './utils';

type MonthViewProps = {
  month: MonthData;
  today: string;
  todayTimestamp: number;
  entries: Record<string, boolean>;
  onDayPress: (dateKey: string) => void;
  onDayLongPress: (dateKey: string) => void;
};

const MonthView = memo(function MonthView({
  month,
  today,
  todayTimestamp,
  entries,
  onDayPress,
  onDayLongPress,
}: MonthViewProps) {
  const { year, month: monthIdx, daysInMonth } = month;
  const rows = buildDayRows(daysInMonth, NUM_COLUMNS);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {MONTH_NAMES[monthIdx]}{' '}
        <Text style={styles.titleYear}>{year}</Text>
      </Text>

      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((day) => {
              const dateKey = formatDateKey(year, monthIdx, day);
              const weekdayAbbr = getWeekdayAbbr(year, monthIdx, day);
              const cellTs = new Date(year, monthIdx, day).getTime();

              return (
                <DayCell
                  key={day}
                  day={day}
                  weekdayAbbr={weekdayAbbr}
                  dateKey={dateKey}
                  isToday={dateKey === today}
                  isFuture={cellTs > todayTimestamp}
                  hasEntry={!!entries[dateKey]}
                  onPress={onDayPress}
                  onLongPress={onDayLongPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: MONTH_H_PADDING,
    paddingBottom: spacing[8],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 38,
    marginTop: spacing[3],
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  titleYear: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  grid: {
    gap: CELL_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
});

export default MonthView;
