import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";
import { AddMemoryCard } from "./AddMemoryCard";
import { ImageCard } from "./media-card/ImageCard";
import { VideoCard } from "./media-card/VideoCard";
import { MediaLightbox } from "./MediaLightbox";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

const MEDIA_HEIGHT = 300;
const H_PAD = 20;

type Props = {
  mediaFiles: Media[];
  onAddPress: () => void;
  onDelete: (id: number) => void;
  onOpenReorder: () => void;
};

type Selected = { uri: string; type: "image" | "video" } | null;

export function MediaPager({ mediaFiles, onAddPress, onDelete, onOpenReorder }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const [selected, setSelected] = useState<Selected>(null);
  const [openOptionsId, setOpenOptionsId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handlePageScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
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
          const CardComponent = item.type === "image" ? ImageCard : VideoCard;

          return (
            <View
              key={item.id}
              style={{ width: screenWidth, height: MEDIA_HEIGHT, paddingHorizontal: H_PAD }}
            >
              <CardComponent
                item={item}
                optionsOpen={optionsOpen}
                onPress={() => {
                  if (optionsOpen) setOpenOptionsId(null);
                  else setSelected({ uri: item.uri, type: item.type });
                }}
                onToggleOptions={() => toggleOptions(item.id)}
                onReorder={() => { setOpenOptionsId(null); onOpenReorder(); }}
                onDelete={() => { setOpenOptionsId(null); setConfirmDeleteId(item.id); }}
              />
            </View>
          );
        })}

        <View style={{ width: screenWidth, height: MEDIA_HEIGHT, paddingHorizontal: H_PAD, justifyContent: "center" }}>
          <AddMemoryCard onPress={onAddPress} />
        </View>
      </ScrollView>

      {/* Page dots */}
      <View style={s.dots}>
        {Array.from({ length: mediaFiles.length + 1 }, (_, i) =>
          i === mediaFiles.length ? (
            <Text key="add" style={[s.dotAdd, i === activePage && s.dotAddActive]}>+</Text>
          ) : (
            <View key={i} style={[s.dot, i === activePage && s.dotActive]} />
          ),
        )}
      </View>

      <MediaLightbox selected={selected} onClose={() => setSelected(null)} />

      <DeleteConfirmModal
        visible={confirmDeleteId !== null}
        onConfirm={() => {
          if (confirmDeleteId !== null) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
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
});
