import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmModal({ visible, onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.iconWrap}>
            <FontAwesomeFreeSolid name="trash" size={20} color={colors.error} />
          </View>
          <Text style={s.title}>Delete media?</Text>
          <Text style={s.body}>
            This photo or video will be permanently removed from this entry.
          </Text>
          <View style={s.btns}>
            <Pressable style={[s.btn, s.btnCancel]} onPress={onCancel}>
              <Text style={s.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[s.btn, s.btnDelete]} onPress={onConfirm}>
              <Text style={s.btnDeleteText}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(63,52,40,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: colors.bgSurface,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  btns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  btnCancel: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  btnDelete: {
    backgroundColor: colors.error,
  },
  btnDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
