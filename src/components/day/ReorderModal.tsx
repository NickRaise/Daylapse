import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Sortable from "react-native-sortables";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";

type Props = {
  visible: boolean;
  mediaFiles: Media[];
  onSave: (newOrder: Media[]) => void;
  onCancel: () => void;
};

export function ReorderModal({ visible, mediaFiles, onSave, onCancel }: Props) {
  const [data, setData] = useState<Media[]>(mediaFiles);

  useEffect(() => {
    if (visible) setData(mediaFiles);
  }, [visible]);

  const renderItem = ({ item }: { item: Media }) => (
    <View style={s.card}>
      <Image
        source={{ uri: item.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {item.type === "video" && (
        <View style={s.playBadge}>
          <FontAwesomeFreeSolid
            name="play"
            size={8}
            color="#fff"
            style={{ marginLeft: 1 }}
          />
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.overlay}>
          <Pressable style={s.backdrop} onPress={onCancel} />
          <View style={s.sheet}>
            <View style={s.handle} />

            <View style={s.header}>
              <Text style={s.title}>Reorder</Text>
              <Pressable onPress={onCancel} style={s.closeBtn} hitSlop={8}>
                <FontAwesomeFreeSolid
                  name="xmark"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <View style={s.grid}>
              <Sortable.Grid
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                columns={3}
                columnGap={8}
                rowGap={8}
                onDragEnd={({ data: newData }) => setData(newData)}
                activeItemScale={1.06}
                activeItemShadowOpacity={0.25}
                inactiveItemOpacity={0.65}
                dropAnimationDuration={280}
              />
            </View>

            <View style={s.footer}>
              <Pressable style={s.saveBtn} onPress={() => onSave(data)}>
                <Text style={s.saveBtnText}>Save Order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: "58%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDark,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  playBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
  },
  saveBtn: {
    backgroundColor: colors.textPrimary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.bg,
  },
});
