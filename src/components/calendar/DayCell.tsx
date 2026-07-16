import { memo } from "react";
import { Text, Pressable, StyleSheet, ImageBackground, View } from "react-native";
import { CELL_SIZE } from "./layout";
import { colors, radius } from "../../theme";

type DayCellProps = {
  day: number;
  weekdayAbbr: string;
  dateKey: string;
  isToday: boolean;
  isFuture: boolean;
  hasEntry: boolean;
  thumbnailUri?: string;
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
  thumbnailUri,
  onPress,
  onLongPress,
}: DayCellProps) {
  const hasThumbnail = !!thumbnailUri && !isFuture && !isToday;

  const cellStyle = [
    styles.cell,
    isToday
      ? styles.todayCell
      : isFuture
        ? styles.futureCell
        : styles.pastCell,
  ];

  if (hasThumbnail) {
    return (
      <Pressable
        style={cellStyle}
        onPress={() => onPress(dateKey)}
        onLongPress={() => onLongPress(dateKey)}
        android_ripple={{ color: colors.ripple, radius: CELL_SIZE / 2 }}
      >
        <ImageBackground
          source={{ uri: thumbnailUri }}
          style={styles.thumbBg}
          resizeMode="cover"
        >
          <View style={styles.sketchLabel}>
            <Text style={styles.sketchNum}>{day}</Text>
            <Text style={styles.sketchWeekday}>{weekdayAbbr}</Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={cellStyle}
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
    overflow: "hidden",
  },
  pastCell: { backgroundColor: colors.bgSurface },
  todayCell: { backgroundColor: colors.primary },
  futureCell: { backgroundColor: colors.bgSubtle },

  // ── Plain cell text ───────────────────────────────────────────────────────
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

  // ── Thumbnail cell ────────────────────────────────────────────────────────
  thumbBg: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: CELL_SIZE * 0.1,
  },
  sketchLabel: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    backgroundColor: "rgba(254, 250, 224, 0.92)",
    paddingHorizontal: CELL_SIZE * 0.11,
    paddingVertical: CELL_SIZE * 0.05,
    // Asymmetric radii for an organic hand-drawn blob feel
    borderTopLeftRadius: CELL_SIZE * 0.28,
    borderTopRightRadius: CELL_SIZE * 0.18,
    borderBottomLeftRadius: CELL_SIZE * 0.15,
    borderBottomRightRadius: CELL_SIZE * 0.26,
    transform: [{ rotate: "-1.5deg" }],
  },
  sketchNum: {
    fontSize: CELL_SIZE * 0.22,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  sketchWeekday: {
    fontSize: CELL_SIZE * 0.1,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default DayCell;
