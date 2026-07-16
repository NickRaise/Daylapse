import { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { useVideoPlayer, VideoView } from "expo-video";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";
import { AddMemoryCard } from "./AddMemoryCard";

const MEDIA_HEIGHT = 300;
const H_PAD = 20;

type Props = {
  mediaFiles: Media[];
  onAddPress: () => void;
  onDelete: (id: number) => void;
  onOpenReorder: () => void;
};

type Selected = { uri: string; type: "image" | "video" } | null;

function VideoLightbox({
  uri,
  screenWidth,
  screenHeight,
}: {
  uri: string;
  screenWidth: number;
  screenHeight: number;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  return (
    <VideoView
      style={{ width: screenWidth, height: screenHeight }}
      player={player}
      nativeControls
    />
  );
}

function ActionsBar({
  onOpenReorder,
  onDelete,
}: {
  onOpenReorder: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={s.actionsBar}>
      <View style={s.actionsPill}>
        <Pressable style={s.actionReorder} onPress={onOpenReorder}>
          <FontAwesomeFreeSolid name="grip-lines" size={12} color={colors.textSecondary} />
          <Text style={s.reorderBtnText}>Reorder</Text>
        </Pressable>
        <View style={s.actionDivider} />
        <Pressable style={s.actionDelete} onPress={onDelete}>
          <FontAwesomeFreeSolid name="trash" size={13} color={colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

export function MediaPager({
  mediaFiles,
  onAddPress,
  onDelete,
  onOpenReorder,
}: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const [selected, setSelected] = useState<Selected>(null);
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handlePageScroll = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActivePage(page);
    setOpenOptionsId(null);
  };

  function toggleOptions(id: number) {
    setOpenOptionsId((prev) => (prev === id ? null : id));
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageScroll}
        style={{ width: screenWidth, height: MEDIA_HEIGHT }}
      >
        {mediaFiles.map((item) => {
          const optionsOpen = openOptionsId === item.id;

          const handleCardPress = () => {
            if (optionsOpen) {
              setOpenOptionsId(null);
            } else if (item.type === "image") {
              setSelected({ uri: item.uri, type: "image" });
            } else {
              setSelected({ uri: item.uri, type: "video" });
            }
          };

          const handleDelete = () => {
            setOpenOptionsId(null);
            setConfirmDeleteId(item.id);
          };

          const handleReorder = () => {
            setOpenOptionsId(null);
            onOpenReorder();
          };

          return (
            <View
              key={item.id}
              style={{
                width: screenWidth,
                height: MEDIA_HEIGHT,
                paddingHorizontal: H_PAD,
              }}
            >
              {item.type === "image" ? (
                <Pressable style={s.mediaCard} onPress={handleCardPress}>
                  <Image
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={s.optionsBtn}
                    hitSlop={12}
                    onPress={() => toggleOptions(item.id)}
                  >
                    <FontAwesomeFreeSolid
                      name="sliders"
                      size={22}
                      color={colors.bgSurface}
                    />
                  </Pressable>
                  {optionsOpen && (
                    <ActionsBar
                      onOpenReorder={handleReorder}
                      onDelete={handleDelete}
                    />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[s.mediaCard, s.videoCard]}
                  onPress={handleCardPress}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                  <View style={s.playBtn}>
                    <FontAwesomeFreeSolid
                      name="play"
                      size={28}
                      color="#fff"
                      style={{ marginLeft: 3 }}
                    />
                  </View>
                  <Pressable
                    style={s.optionsBtn}
                    hitSlop={12}
                    onPress={() => toggleOptions(item.id)}
                  >
                    <FontAwesomeFreeSolid
                      name="sliders"
                      size={22}
                      color={colors.textOnAccent}
                    />
                  </Pressable>
                  {optionsOpen && (
                    <ActionsBar
                      onOpenReorder={handleReorder}
                      onDelete={handleDelete}
                    />
                  )}
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Add media — last slide */}
        <View
          style={{
            width: screenWidth,
            height: MEDIA_HEIGHT,
            paddingHorizontal: H_PAD,
            justifyContent: "center",
          }}
        >
          <AddMemoryCard onPress={onAddPress} />
        </View>
      </ScrollView>

      {/* Page dots — media + add slide */}
      <View style={s.dots}>
        {Array.from({ length: mediaFiles.length + 1 }, (_, i) =>
          i === mediaFiles.length ? (
            <Text
              key="add"
              style={[s.dotAdd, i === activePage && s.dotAddActive]}
            >
              +
            </Text>
          ) : (
            <View key={i} style={[s.dot, i === activePage && s.dotActive]} />
          ),
        )}
      </View>

      {/* Full-screen lightbox */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelected(null)}
      >
        <StatusBar hidden />
        <View style={s.lightbox}>
          {selected?.type === "image" ? (
            <Image
              source={{ uri: selected.uri }}
              style={{ width: screenWidth, height: screenHeight }}
              resizeMode="contain"
            />
          ) : selected?.type === "video" ? (
            <VideoLightbox
              uri={selected.uri}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
            />
          ) : null}

          <Pressable style={s.closeBtn} onPress={() => setSelected(null)}>
            <FontAwesomeFreeSolid name="xmark" size={18} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        visible={confirmDeleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDeleteId(null)}
      >
        <Pressable style={s.confirmBackdrop} onPress={() => setConfirmDeleteId(null)}>
          <Pressable style={s.confirmCard} onPress={() => {}}>
            <View style={s.confirmIconWrap}>
              <FontAwesomeFreeSolid name="trash" size={20} color={colors.error} />
            </View>
            <Text style={s.confirmTitle}>Delete media?</Text>
            <Text style={s.confirmBody}>
              This photo or video will be permanently removed from this entry.
            </Text>
            <View style={s.confirmBtns}>
              <Pressable
                style={[s.confirmBtn, s.confirmBtnCancel]}
                onPress={() => setConfirmDeleteId(null)}
              >
                <Text style={s.confirmBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.confirmBtn, s.confirmBtnDelete]}
                onPress={() => {
                  if (confirmDeleteId !== null) onDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                <Text style={s.confirmBtnDeleteText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  mediaCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  videoCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  optionsBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
  actionsBar: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actionsPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSurface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionReorder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  actionDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },
  actionDelete: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderDark,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.textSecondary,
  },
  dotAdd: {
    fontSize: 10,
    lineHeight: 10,
    color: colors.borderDark,
    fontWeight: "600",
  },
  dotAddActive: {
    color: colors.textSecondary,
  },
  lightbox: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(63,52,40,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  confirmCard: {
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
  confirmIconWrap: {
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
  confirmTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  confirmBody: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnCancel: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmBtnCancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  confirmBtnDelete: {
    backgroundColor: colors.error,
  },
  confirmBtnDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
