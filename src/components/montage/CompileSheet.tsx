import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";
import { formatDateKey } from "@/components/calendar/utils";
import { MiniCalendarPicker } from "@/components/montage/MiniCalendarPicker";

export type CompileRange = { start: string; end: string; title: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onCompile: (range: CompileRange) => void;
};

type PresetId = "month" | "year" | "custom";

const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function thisMonthRange(): CompileRange {
  const now = new Date();
  const start = formatDateKey(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const end = formatDateKey(now.getFullYear(), now.getMonth(), lastDay);
  return { start, end, title: `${MONTH_NAMES_LONG[now.getMonth()]} ${now.getFullYear()}` };
}

function thisYearRange(): CompileRange {
  const now = new Date();
  const start = formatDateKey(now.getFullYear(), 0, 1);
  const end = formatDateKey(now.getFullYear(), 11, 31);
  return { start, end, title: `${now.getFullYear()}` };
}

export function CompileSheet({ visible, onClose, onCompile }: Props) {
  const [preset, setPreset] = useState<PresetId>("month");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const customValid = !!rangeStart && !!rangeEnd;

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
    if (preset === "month") return onCompile(thisMonthRange());
    if (preset === "year") return onCompile(thisYearRange());
    if (!rangeStart || !rangeEnd) return;
    onCompile({ start: rangeStart, end: rangeEnd, title: `${rangeStart} – ${rangeEnd}` });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Compile a montage</Text>

          <View style={s.presetRow}>
            {(["month", "year", "custom"] as PresetId[]).map((p) => (
              <Pressable
                key={p}
                style={[s.presetPill, preset === p && s.presetPillActive]}
                onPress={() => setPreset(p)}
              >
                <Text style={[s.presetText, preset === p && s.presetTextActive]}>
                  {p === "month" ? "This Month" : p === "year" ? "This Year" : "Custom"}
                </Text>
              </Pressable>
            ))}
          </View>

          {preset === "custom" && (
            <View style={s.customRow}>
              <Text style={s.hint}>
                {!rangeStart
                  ? "Tap a day to start"
                  : !rangeEnd
                    ? "Tap another day to set the end"
                    : `${rangeStart} – ${rangeEnd}`}
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
            <Text style={s.compileBtnText}>Compile</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
});
