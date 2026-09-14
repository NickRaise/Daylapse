import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { formatDateKey, MONTH_NAMES } from "@/components/calendar/utils";
import { MiniCalendarPicker } from "@/components/montage/MiniCalendarPicker";
import { montageLabelText } from "@/components/montage/montageLabel";

export type CompileRange = { start: string; end: string; title: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onCompile: (range: CompileRange) => void;
};

type PresetId = "month" | "year" | "custom";

// Last completed month/year, not the current one — a story woven from an in-progress month would be missing its ending.
function lastCompletedMonth(): { year: number; month: number } {
  const now = new Date();
  return now.getMonth() === 0
    ? { year: now.getFullYear() - 1, month: 11 }
    : { year: now.getFullYear(), month: now.getMonth() - 1 };
}

function monthRange(year: number, month: number): CompileRange {
  const start = formatDateKey(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = formatDateKey(year, month, lastDay);
  return { start, end, title: `${MONTH_NAMES[month]} ${year}` };
}

function yearRange(year: number): CompileRange {
  const start = formatDateKey(year, 0, 1);
  const end = formatDateKey(year, 11, 31);
  return { start, end, title: `${year}` };
}

export function CompileSheet({ visible, onClose, onCompile }: Props) {
  const s = useStyles();
  const colors = useColors();
  const [preset, setPreset] = useState<PresetId>("month");
  const [monthPick, setMonthPick] = useState(lastCompletedMonth);
  const [yearPick, setYearPick] = useState(() => new Date().getFullYear() - 1);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const customValid = !!rangeStart && !!rangeEnd;
  const lastMonth = lastCompletedMonth();
  const atLastMonth = monthPick.year === lastMonth.year && monthPick.month === lastMonth.month;
  const atLastYear = yearPick === new Date().getFullYear() - 1;

  function stepMonth(delta: 1 | -1) {
    setMonthPick((prev) => {
      let { year, month } = prev;
      month += delta;
      if (month < 0) {
        month = 11;
        year -= 1;
      } else if (month > 11) {
        month = 0;
        year += 1;
      }
      if (year > lastMonth.year || (year === lastMonth.year && month > lastMonth.month)) return prev;
      return { year, month };
    });
  }

  function stepYear(delta: 1 | -1) {
    setYearPick((prev) => Math.min(prev + delta, new Date().getFullYear() - 1));
  }

  // First tap starts a new range; the next tap sets its end (swapping if tapped out of order); after that, the cycle restarts.
  function handleSelectDay(dateKey: string) {
    if (!rangeStart || rangeEnd) {
      setRangeStart(dateKey);
      setRangeEnd(null);
      return;
    }
    if (dateKey < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(dateKey);
    } else {
      setRangeEnd(dateKey);
    }
  }

  function handleCompile() {
    if (preset === "month") return onCompile(monthRange(monthPick.year, monthPick.month));
    if (preset === "year") return onCompile(yearRange(yearPick));
    if (!rangeStart || !rangeEnd) return;
    onCompile({ start: rangeStart, end: rangeEnd, title: `${rangeStart} – ${rangeEnd}` });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Weave a story</Text>

          <View style={s.presetRow}>
            {(["month", "year", "custom"] as PresetId[]).map((p) => (
              <Pressable
                key={p}
                style={[s.presetPill, preset === p && s.presetPillActive]}
                onPress={() => setPreset(p)}
              >
                <Text style={[s.presetText, preset === p && s.presetTextActive]}>
                  {p === "month" ? "A month" : p === "year" ? "A year" : "Choose days"}
                </Text>
              </Pressable>
            ))}
          </View>

          {preset === "month" && (
            <View style={s.periodRow}>
              <Pressable onPress={() => stepMonth(-1)} hitSlop={10} style={s.navBtn}>
                <FontAwesomeFreeSolid name="chevron-left" size={13} color={colors.textSecondary} />
              </Pressable>
              <Text style={s.periodText}>{MONTH_NAMES[monthPick.month]} {monthPick.year}</Text>
              <Pressable
                onPress={() => stepMonth(1)}
                hitSlop={10}
                style={[s.navBtn, atLastMonth && s.navBtnDisabled]}
                disabled={atLastMonth}
              >
                <FontAwesomeFreeSolid name="chevron-right" size={13} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}

          {preset === "year" && (
            <View style={s.periodRow}>
              <Pressable onPress={() => stepYear(-1)} hitSlop={10} style={s.navBtn}>
                <FontAwesomeFreeSolid name="chevron-left" size={13} color={colors.textSecondary} />
              </Pressable>
              <Text style={s.periodText}>{yearPick}</Text>
              <Pressable
                onPress={() => stepYear(1)}
                hitSlop={10}
                style={[s.navBtn, atLastYear && s.navBtnDisabled]}
                disabled={atLastYear}
              >
                <FontAwesomeFreeSolid name="chevron-right" size={13} color={colors.textSecondary} />
              </Pressable>
            </View>
          )}

          {preset === "custom" && (
            <View style={s.customRow}>
              <Text style={s.hint}>
                {!rangeStart
                  ? "Tap the day it begins"
                  : !rangeEnd
                    ? "Now tap the day it ends"
                    : montageLabelText(rangeStart, rangeEnd)}
              </Text>
              <MiniCalendarPicker
                startKey={rangeStart}
                endKey={rangeEnd}
                onSelectDay={handleSelectDay}
              />
            </View>
          )}

          <Pressable
            style={[s.compileBtn, preset === "custom" && !customValid && s.compileBtnDisabled]}
            onPress={handleCompile}
            disabled={preset === "custom" && !customValid}
          >
            <Text style={s.compileBtnText}>Weave it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    paddingTop: 10,
    gap: spacing[4],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  presetRow: { flexDirection: "row", gap: spacing[2] },
  presetPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  presetPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textSecondary },
  presetTextActive: { color: colors.textOnAccent },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    paddingVertical: spacing[2],
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: { opacity: 0.35 },
  periodText: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.textPrimary,
    minWidth: 120,
    textAlign: "center",
  },
  customRow: { gap: spacing[3] },
  hint: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  compileBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  compileBtnDisabled: { opacity: 0.4 },
  compileBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.textOnAccent },
}));
