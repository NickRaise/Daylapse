import { memo } from "react";
import { Text, Pressable, StyleSheet } from "react-native";
import { CELL_SIZE } from "./layout";
import { colors, radius } from "../../theme";

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
        isToday
          ? styles.todayCell
          : isFuture
            ? styles.futureCell
            : styles.pastCell,
      ]}
      onPress={() => onPress(dateKey)}
      onLongPress={() => onLongPress(dateKey)}
      android_ripple={{ color: colors.ripple, radius: CELL_SIZE / 2 }}
    >
      <Text
        style={[
          styles.dayNum,
          isToday
            ? styles.todayText
            : isFuture
              ? styles.futureText
              : styles.pastText,
        ]}
      >
        {day}
      </Text>

      <Text
        style={[
          styles.weekday,
          isToday
            ? styles.todayWeekday
            : isFuture
              ? styles.futureWeekday
              : styles.pastWeekday,
        ]}
      >
        {weekdayAbbr}
      </Text>

      {!hasEntry && !isFuture && !isToday && <Text style={styles.plus}>+</Text>}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pastCell: { backgroundColor: colors.bgSurface },
  todayCell: { backgroundColor: colors.primary },
  futureCell: { backgroundColor: colors.bgSubtle },

  dayNum: {
    fontSize: CELL_SIZE * 0.24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  pastText: { color: colors.textPrimary },
  todayText: { color: colors.textOnAccent },
  futureText: { color: colors.textDisabled },

  weekday: {
    fontSize: CELL_SIZE * 0.11,
    fontWeight: "500",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pastWeekday: { color: colors.textMuted },
  todayWeekday: { color: colors.textOnAccentDim },
  futureWeekday: { color: colors.bgElevated },

  plus: {
    position: "absolute",
    bottom: CELL_SIZE * 0.1,
    fontSize: CELL_SIZE * 0.13,
    color: colors.bgElevated,
  },
});

export default DayCell;
