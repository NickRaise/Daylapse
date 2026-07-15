import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

type Props = { onPress: () => void; style?: ViewStyle };

export function AddMemoryCard({ onPress, style }: Props) {
  return (
    <Pressable style={[s.card, style]} onPress={onPress}>
      <FontAwesomeFreeSolid name="plus" size={15} color={colors.textMuted} />
      <Text style={s.label}>Add a memory</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.borderDark,
    backgroundColor: colors.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
