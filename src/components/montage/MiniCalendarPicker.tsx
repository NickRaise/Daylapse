import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import { formatDateKey, MONTH_NAMES } from "@/components/calendar/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  startKey: string | null;
  endKey: string | null;
  onSelectDay: (dateKey: string) => void;
};

// Weekday-aligned single-month grid (unlike the main Calendar tab's 3-column photo grid) — the traditional shape expected for picking a date range.
export function MiniCalendarPicker({ startKey, endKey, onSelectDay }: Props) {
  const initial = startKey ? new Date(startKey) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={goPrevMonth} hitSlop={10} style={s.navBtn}>
          <FontAwesomeFreeSolid name="chevron-left" size={13} color={colors.textSecondary} />
        </Pressable>
        <Text style={s.headerText}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
        <Pressable onPress={goNextMonth} hitSlop={10} style={s.navBtn}>
          <FontAwesomeFreeSolid name="chevron-right" size={13} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={s.weekdayRow}>
        {WEEKDAY_LABELS.map((w, i) => (
          <Text key={i} style={s.weekdayLabel}>{w}</Text>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={s.dayRow}>
          {row.map((day, ci) => {
            if (day === null) return <View key={ci} style={s.dayCell} />;
            const dateKey = formatDateKey(viewYear, viewMonth, day);
            const isEndpoint = dateKey === startKey || dateKey === endKey;
            const inRange =
              !!startKey && !!endKey && dateKey > startKey && dateKey < endKey;
            return (
              <Pressable
                key={ci}
                style={[s.dayCell, inRange && s.dayCellInRange]}
                onPress={() => onSelectDay(dateKey)}
              >
                <View style={[s.dayInner, isEndpoint && s.dayInnerSelected]}>
                  <Text style={[s.dayText, isEndpoint && s.dayTextSelected]}>{day}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: spacing[2] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  weekdayRow: { flexDirection: "row" },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
  },
  dayRow: { flexDirection: "row" },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellInRange: {
    backgroundColor: colors.bgSubtle,
  },
  dayInner: {
    width: "78%",
    aspectRatio: 1,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dayInnerSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.textOnAccent,
    fontWeight: "700",
  },
});
