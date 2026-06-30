import { Button, StyleSheet, Text, View } from "react-native";
import { colors, spacing, fontSize } from "../../theme";

type Props = {
  onRequest: () => void;
};

export function CameraPermission({ onRequest }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.title}>Camera access needed</Text>
      <Button onPress={onRequest} title="Grant camera permission" />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: spacing[4],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
});
