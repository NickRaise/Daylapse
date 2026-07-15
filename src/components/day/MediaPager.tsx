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
      <Pressable style={[s.actionBtn, s.reorderBtn]} onPress={onOpenReorder}>
        <FontAwesomeFreeSolid
          name="grip-lines"
          size={13}
          color={colors.textPrimary}
        />
        <Text style={s.reorderBtnText}>Reorder</Text>
      </Pressable>
      <Pressable style={s.actionBtn} onPress={onDelete}>
        <FontAwesomeFreeSolid name="trash" size={14} color={colors.error} />
      </Pressable>
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
            onDelete(item.id);
            setOpenOptionsId(null);
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
                      color={colors.textPrimary}
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
                      size={20}
                      color={colors.textPrimary}
                      style={{ marginLeft: 2 }}
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
                      color={colors.textPrimary}
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
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
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  reorderBtn: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    width: "auto",
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  actionBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
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
});
