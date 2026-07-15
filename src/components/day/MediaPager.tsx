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

export function MediaPager({ mediaFiles, onAddPress }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const [selected, setSelected] = useState<Selected>(null);

  const handlePageScroll = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActivePage(page);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageScroll}
        style={{ width: screenWidth, height: MEDIA_HEIGHT }}
      >
        {mediaFiles.map((item) => (
          <View
            key={item.id}
            style={{
              width: screenWidth,
              height: MEDIA_HEIGHT,
              paddingHorizontal: H_PAD,
            }}
          >
            {item.type === "image" ? (
              <Pressable
                style={s.mediaCard}
                onPress={() => setSelected({ uri: item.uri, type: "image" })}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </Pressable>
            ) : (
              <Pressable
                style={[s.mediaCard, s.videoCard]}
                onPress={() => setSelected({ uri: item.uri, type: "video" })}
              >
                {item.thumbnailUri ? (
                  <Image
                    source={{ uri: item.thumbnailUri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={s.playBtn}>
                  <FontAwesomeFreeSolid
                    name="play"
                    size={20}
                    color={colors.textPrimary}
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </Pressable>
            )}
          </View>
        ))}

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
  // ── Lightbox ────────────────────────────────────────────────────────────────
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
