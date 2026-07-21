import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";
import type { DateStampFormat } from "@/types";

type Props = {
  enabled: boolean;
  format: DateStampFormat;
  onToggle: (v: boolean) => void;
  onFormatChange: (fmt: DateStampFormat) => void;
};

const FORMATS: { label: string; value: DateStampFormat }[] = [
  { label: "16 Jul",       value: "DD MMM"       },
  { label: "16 Jul 2026",  value: "DD MMM YYYY"  },
  { label: "Jul 16, 2026", value: "MMM DD, YYYY" },
];

export function DateStampControl({ enabled, format, onToggle, onFormatChange }: Props) {
  return (
    <View style={s.root}>

      {/* Toggle */}
      <View style={s.toggleRow}>
        <View style={s.toggleText}>
          <Text style={s.label}>Stamp date on media</Text>
          <Text style={s.desc}>Always placed at the bottom-right</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.bgSurface}
        />
      </View>

      {enabled && (
        <>
          <View style={s.divider} />
          <Text style={s.subLabel}>Format</Text>
          <View style={s.btnRow}>
            {FORMATS.map(({ label, value }) => (
              <Pressable
                key={value}
                style={[s.btn, format === value && s.btnActive]}
                onPress={() => onFormatChange(value)}
              >
                <Text style={[s.btnText, format === value && s.btnTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: spacing[3] },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleText: { flex: 1, gap: 2 },
  label: { fontSize: fontSize.sm, fontWeight: "600", color: colors.textPrimary },
  desc:  { fontSize: fontSize.xs, color: colors.textSecondary },

  divider: { height: 1, backgroundColor: colors.border },

  subLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  btnRow: { flexDirection: "row", gap: spacing[2] },
  btn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
  },
  btnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnText: { fontSize: fontSize.xs, fontWeight: "500", color: colors.textSecondary },
  btnTextActive: { color: colors.textOnAccent, fontWeight: "600" },
});
