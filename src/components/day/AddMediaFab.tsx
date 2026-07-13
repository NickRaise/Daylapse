import { Pressable, StyleSheet, Text } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

const H_PAD = 20;

type Props = { onPress: () => void };

export function AddMediaFab({ onPress }: Props) {
  return (
    <Pressable style={s.fab} onPress={onPress}>
      <FontAwesomeFreeSolid name="plus" size={14} color={colors.textOnAccent} />
      <Text style={s.label}>Add media</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 50,
    right: H_PAD,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  label: {
    color: colors.textOnAccent,
    fontSize: 14,
    fontWeight: "600",
  },
});
