import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import { colors } from "@/theme";
import type { Media } from "@/db/schema";
import { AddMemoryCard } from "./AddMemoryCard";

const MEDIA_HEIGHT = 300;
const H_PAD = 20;

type Props = {
  mediaFiles: Media[];
  onAddPress: () => void;
};

export function MediaPager({ mediaFiles, onAddPress }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);

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
              <Image
                source={{ uri: item.uri }}
                style={s.mediaCard}
                resizeMode="cover"
              />
            ) : (
              <View style={[s.mediaCard, s.videoCard]}>
                <View style={s.playBtn}>
                  <FontAwesomeFreeSolid
                    name="play"
                    size={20}
                    color={colors.textPrimary}
                    style={{ marginLeft: 2 }}
                  />
                </View>
              </View>
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
            <View
              key={i}
              style={[s.dot, i === activePage && s.dotActive]}
            />
          ),
        )}
      </View>
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
});
