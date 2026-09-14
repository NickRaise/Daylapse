import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { formatDateKey, MONTH_NAMES } from "@/components/calendar/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Props = {
  startKey: string | null;
  endKey: string | null;
  onSelectDay: (dateKey: string) => void;
};

// Weekday-aligned single-month grid (unlike the main Calendar tab's 3-column photo grid) — the traditional shape expected for picking a date range.
// Tapping the month/year header jumps to a month grid for fast year-to-year travel; the day grid handles fine-grained date picking.
export function MiniCalendarPicker({ startKey, endKey, onSelectDay }: Props) {
  const s = useStyles();
  const colors = useColors();
  const today = new Date();
  const initial = startKey ? new Date(startKey) : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [pickingMonth, setPickingMonth] = useState(false);

  const atCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const atCurrentYear = viewYear === today.getFullYear();

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
    if (atCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goPrevYear() {
    setViewYear((y) => y - 1);
  }

  function goNextYear() {
    if (!atCurrentYear) setViewYear((y) => y + 1);
  }

  function pickMonth(m: number) {
    setViewMonth(m);
    setPickingMonth(false);
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Pressable onPress={goPrevYear} hitSlop={10} style={s.navBtn}>
          <FontAwesomeFreeSolid name="angles-left" size={12} color={colors.textSecondary} />
        </Pressable>
        {!pickingMonth && (
          <Pressable onPress={goPrevMonth} hitSlop={10} style={s.navBtn}>
            <FontAwesomeFreeSolid name="chevron-left" size={13} color={colors.textSecondary} />
          </Pressable>
        )}
        <Pressable onPress={() => setPickingMonth((v) => !v)} style={s.headerTextBtn} hitSlop={6}>
          <Text style={s.headerText}>{pickingMonth ? viewYear : `${MONTH_NAMES[viewMonth]} ${viewYear}`}</Text>
        </Pressable>
        {!pickingMonth && (
          <Pressable
            onPress={goNextMonth}
            hitSlop={10}
            style={[s.navBtn, atCurrentMonth && s.navBtnDisabled]}
            disabled={atCurrentMonth}
          >
            <FontAwesomeFreeSolid name="chevron-right" size={13} color={colors.textSecondary} />
          </Pressable>
        )}
        <Pressable
          onPress={goNextYear}
          hitSlop={10}
          style={[s.navBtn, atCurrentYear && s.navBtnDisabled]}
          disabled={atCurrentYear}
        >
          <FontAwesomeFreeSolid name="angles-right" size={12} color={colors.textSecondary} />
        </Pressable>
      </View>

      {pickingMonth ? (
        <View style={s.monthGrid}>
          {MONTH_ABBR.map((label, m) => {
            const disabled = viewYear === today.getFullYear() && m > today.getMonth();
            const active = m === viewMonth;
            return (
              <Pressable
                key={label}
                style={[s.monthCell, active && s.monthCellActive, disabled && s.monthCellDisabled]}
                onPress={() => pickMonth(m)}
                disabled={disabled}
              >
                <Text style={[s.monthCellText, active && s.monthCellTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <>
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
                const isFuture = dateKey > formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
                const isEndpoint = dateKey === startKey || dateKey === endKey;
                const inRange =
                  !!startKey && !!endKey && dateKey > startKey && dateKey < endKey;
                return (
                  <Pressable
                    key={ci}
                    style={[s.dayCell, inRange && s.dayCellInRange]}
                    onPress={() => onSelectDay(dateKey)}
                    disabled={isFuture}
                  >
                    <View style={[s.dayInner, isEndpoint && s.dayInnerSelected]}>
                      <Text style={[s.dayText, isEndpoint && s.dayTextSelected, isFuture && s.dayTextFuture]}>
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { gap: spacing[2] },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: { opacity: 0.35 },
  headerTextBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
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
  dayTextFuture: {
    color: colors.textDisabled,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  monthCell: {
    width: "31%",
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    backgroundColor: colors.bgSubtle,
  },
  monthCellActive: { backgroundColor: colors.primary },
  monthCellDisabled: { opacity: 0.35 },
  monthCellText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  monthCellTextActive: { color: colors.textOnAccent },
}));
