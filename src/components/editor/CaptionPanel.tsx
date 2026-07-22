import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { CaptionPosition, CaptionSize, CaptionStyle, DateStampStyle } from "@/types";

export type { CaptionPosition, CaptionSize, CaptionStyle, DateStampStyle };

const MAX_LEN = 120;
const SWATCH = 42;

const TEXT_COLORS = ["#FFFFFF", "#000000", "#F3E9D2", "#3F3428"];

const BG_OPTIONS: Array<{ value: string; fill?: string }> = [
  { value: "transparent" },
  { value: "rgba(0,0,0,0.5)",        fill: "#000000" },
  { value: "rgba(255,255,255,0.5)",  fill: "#FFFFFF" },
  { value: "rgba(212,163,115,0.45)", fill: "#D4A373" },
];

type Props = {
  value: string;
  onChange: (text: string) => void;
  style: CaptionStyle;
  onStyleChange: (s: CaptionStyle) => void;
  dateEnabled: boolean;
  onDateToggle: (v: boolean) => void;
};

export function CaptionPanel({ value, onChange, style, onStyleChange, dateEnabled, onDateToggle }: Props) {
  function update(patch: Partial<CaptionStyle>) {
    onStyleChange({ ...style, ...patch });
  }

  return (
    <View style={s.root}>

      {/* ── Date stamp toggle ── */}
      <View style={s.toggleRow}>
        <Text style={s.toggleLabel}>Stamp date on media</Text>
        <Switch
          value={dateEnabled}
          onValueChange={onDateToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.bgSurface}
        />
      </View>

      {/* ── Caption text ── */}
      <View style={s.inputWrap}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={(t) => onChange(t.slice(0, MAX_LEN))}
          placeholder="Write something on your memory…"
          placeholderTextColor={colors.placeholderSecondary}
          multiline
          maxLength={MAX_LEN}
          returnKeyType="done"
          blurOnSubmit
          textAlignVertical="top"
        />
        <Text style={s.counter}>{value.length}/{MAX_LEN}</Text>
      </View>

      {/* ── Text color ── */}
      <View style={s.colorBlock}>
        <Text style={s.colorLabel}>Text color</Text>
        <View style={s.swatchRow}>
          {TEXT_COLORS.map((c) => (
            <View key={c} style={s.swatchCell}>
              <Pressable
                hitSlop={6}
                onPress={() => update({ textColor: c })}
                style={[
                  s.swatch,
                  { backgroundColor: c },
                  (c === "#FFFFFF" || c === "#F3E9D2") && s.swatchLightBorder,
                  style.textColor === c && s.swatchSelected,
                ]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* ── Background ── */}
      <View style={s.colorBlock}>
        <Text style={s.colorLabel}>Background</Text>
        <View style={s.swatchRow}>
          {BG_OPTIONS.map(({ value: v, fill }) => {
            const sel = style.bgColor === v;
            return (
              <View key={v} style={s.swatchCell}>
                <Pressable
                  hitSlop={6}
                  onPress={() => update({ bgColor: v })}
                  style={[
                    s.swatch,
                    fill ? { backgroundColor: fill } : s.swatchNone,
                    fill === "#FFFFFF" && s.swatchLightBorder,
                    sel && s.swatchSelected,
                  ]}
                >
                  {!fill && <Text style={s.noneX}>×</Text>}
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: spacing[3] },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  inputWrap: { gap: 4 },
  input: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 68,
    lineHeight: 22,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
  },

  colorBlock: { gap: spacing[2] },
  colorLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  swatchRow: {
    flexDirection: "row",
  },
  swatchCell: {
    flex: 1,
    alignItems: "center",
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: SWATCH / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  swatchLightBorder: {
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  swatchNone: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  swatchSelected: {
    borderWidth: 3.5,
    borderColor: colors.primary,
  },
  noneX: {
    fontSize: 20,
    color: colors.error,
    fontWeight: "700",
    lineHeight: 22,
  },
});
