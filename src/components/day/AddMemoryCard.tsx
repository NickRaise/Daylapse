import { Pressable, StyleSheet, Text } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

type Props = { onPress: () => void };

export function AddMemoryCard({ onPress }: Props) {
  return (
    <Pressable style={s.card} onPress={onPress}>
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
