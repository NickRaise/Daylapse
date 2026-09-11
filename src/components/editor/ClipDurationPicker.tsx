import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, spacing } from "@/theme";

const PRESET_DURATIONS = [1, 3, 5, 10] as const;

type Props = {
  currentDuration: number;
  maxDuration: number;
  onDurationChange: (seconds: number) => void;
};

export function ClipDurationPicker({ currentDuration, maxDuration, onDurationChange }: Props) {
  const [isCustom, setIsCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  // Tracks which preset the user picked, separately from the (possibly
  // clamped) applied duration, so a too-long preset still shows selected.
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    () => PRESET_DURATIONS.find((d) => Math.abs(currentDuration - d) < 0.05) ?? null,
  );

  function handleCustomSubmit() {
    const v = parseFloat(customText);
    if (isNaN(v) || v <= 0) return;
    // Reflect the actual (possibly clamped) applied value, so the input never
    // silently disagrees with what's really selected.
    const clamped = Math.min(v, maxDuration);
    onDurationChange(clamped);
    setCustomText(clamped.toFixed(1));
  }

  return (
    <>
      <Text style={s.clipDurLabel}>{currentDuration.toFixed(1)}s</Text>

      <View style={s.row}>
        <Text style={s.rowLabel}>Clip</Text>

        {PRESET_DURATIONS.map((d) => {
          const active = !isCustom && selectedPreset === d;
          return (
            <Pressable
              key={d}
              style={[s.pill, active && s.pillActive]}
              onPress={() => {
                setIsCustom(false);
                setSelectedPreset(d);
                onDurationChange(d);
              }}
            >
              <Text style={[s.pillText, active && s.pillTextActive]}>{d}s</Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[s.pill, isCustom && s.pillActive]}
          onPress={() => { setIsCustom(true); setSelectedPreset(null); }}
        >
          {isCustom ? (
            <TextInput
              style={s.customInput}
              value={customText}
              onChangeText={setCustomText}
              onSubmitEditing={handleCustomSubmit}
              onBlur={handleCustomSubmit}
              keyboardType="decimal-pad"
              placeholder="s"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              autoFocus
              maxLength={5}
            />
          ) : (
            <Text style={[s.pillText, isCustom && s.pillTextActive]}>Custom</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  clipDurLabel: {
    textAlign: "center",
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  rowLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: 2,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
    minWidth: 40,
    alignItems: "center",
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: fontSize.sm, fontWeight: "500", color: colors.textSecondary },
  pillTextActive: { color: colors.textOnAccent, fontWeight: "600" },
  customInput: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textOnAccent,
    minWidth: 40,
    textAlign: "center",
    padding: 0,
  },
});
