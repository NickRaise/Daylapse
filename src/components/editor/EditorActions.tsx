import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";

type Props = {
  onRetake: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export function EditorActions({ onRetake, onSave, isSaving }: Props) {
  const s = useStyles();
  const colors = useColors();
  return (
    <View style={s.actions}>
      <Pressable style={[s.btn, s.btnSecondary]} onPress={onRetake}>
        <Text style={s.btnSecText}>Retake</Text>
      </Pressable>
      <Pressable
        style={[s.btn, s.btnPrimary, isSaving && s.btnDisabled]}
        onPress={onSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.textOnAccent} />
        ) : (
          <Text style={s.btnPrimText}>Save</Text>
        )}
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  actions: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnSecondary: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.6 },
  btnSecText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  btnPrimText: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textOnAccent,
  },
}));
