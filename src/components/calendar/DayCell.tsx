import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CELL_SIZE } from './layout';

type DayCellProps = {
  day: number;
  weekdayAbbr: string;
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  hasEntry: boolean;
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
};

const DayCell = memo(function DayCell({
  day,
  weekdayAbbr,
  dateKey,
  isToday,
  isFuture,
  hasEntry,
  onPress,
  onLongPress,
}: DayCellProps) {
  return (
    <Pressable
      style={[
        styles.cell,
        isToday ? styles.todayCell : isFuture ? styles.futureCell : styles.pastCell,
      ]}
      onPress={() => onPress(dateKey)}
      onLongPress={() => onLongPress(dateKey)}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', radius: CELL_SIZE / 2 }}
    >
      <Text
        style={[
          styles.dayNum,
          isToday ? styles.todayText : isFuture ? styles.futureText : styles.pastText,
        ]}
      >
        {day}
      </Text>

      <Text
        style={[
          styles.weekday,
          isToday ? styles.todayWeekday : isFuture ? styles.futureWeekday : styles.pastWeekday,
        ]}
      >
        {weekdayAbbr}
      </Text>

      {!hasEntry && !isFuture && !isToday && (
        <Text style={styles.plus}>+</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE, // square
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pastCell: { backgroundColor: '#1A1A1A' },
  todayCell: { backgroundColor: '#FF6B35' },
  futureCell: { backgroundColor: '#0C0C0C' },

  dayNum: {
    fontSize: CELL_SIZE * 0.24, // scales with cell size
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  pastText: { color: '#EBEBEB' },
  todayText: { color: '#FFFFFF' },
  futureText: { color: '#252525' },

  weekday: {
    fontSize: CELL_SIZE * 0.11,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pastWeekday: { color: '#555555' },
  todayWeekday: { color: 'rgba(255,255,255,0.7)' },
  futureWeekday: { color: '#1E1E1E' },

  plus: {
    position: 'absolute',
    bottom: CELL_SIZE * 0.1,
    fontSize: CELL_SIZE * 0.13,
    color: '#2A2A2A',
  },
});

export default DayCell;
