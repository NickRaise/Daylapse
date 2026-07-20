import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";

type Props = {
  value: string;
  onChange: (text: string) => void;
  isVideo?: boolean;
};

const MAX_LEN = 120;

export function CaptionPanel({ value, onChange, isVideo }: Props) {
  return (
    <View style={s.root}>
      <Text style={s.label}>Caption</Text>
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
      <View style={s.footer}>
        <Text style={s.hint}>
          {isVideo
            ? "Text appears on the frame in the editor — tap away to drag it."
            : "Text is printed directly onto the photo when saved. Drag to position it on the frame."}
        </Text>
        <Text style={s.counter}>{value.length}/{MAX_LEN}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: spacing[2] },
  label: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 72,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
  },
  hint: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
    fontStyle: "italic",
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    flexShrink: 0,
  },
});
