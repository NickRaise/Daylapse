import { Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

type Props = {
  onOpenReorder: () => void;
  onDelete: () => void;
};

export function ActionsBar({ onOpenReorder, onDelete }: Props) {
  return (
    <View style={s.actionsBar}>
      <View style={s.pill}>
        <Pressable style={s.reorder} onPress={onOpenReorder}>
          <FontAwesomeFreeSolid name="grip-lines" size={12} color={colors.textSecondary} />
          <Text style={s.reorderText}>Reorder</Text>
        </Pressable>
        <View style={s.divider} />
        <Pressable style={s.delete} onPress={onDelete}>
          <FontAwesomeFreeSolid name="trash" size={13} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  actionsBar: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reorder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  reorderText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },
  delete: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
  },
});
