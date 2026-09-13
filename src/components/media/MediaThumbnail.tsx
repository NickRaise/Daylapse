import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as VideoThumbnails from "expo-video-thumbnails";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { makeStyles, radius, useColors } from "@/theme";

export type MediaKind = "image" | "video";

const posterCache = new Map<string, Promise<string | null>>();

export function getVideoPoster(uri: string): Promise<string | null> {
  let cached = posterCache.get(uri);
  if (!cached) {
    cached = VideoThumbnails.getThumbnailAsync(uri, { time: 500 })
      .then((r) => r.uri)
      .catch((error) => {
        console.error("[MediaThumbnail] poster generation failed:", uri, error);
        return null;
      });
    posterCache.set(uri, cached);
  }
  return cached;
}

type Props = {
  uri: string;
  type: MediaKind;
};

// Renders a photo directly, or a lazily-generated (and cached) poster frame for a video.
export const MediaThumbnail = memo(function MediaThumbnail({ uri, type }: Props) {
  const s = useStyles();
  const colors = useColors();
  const [posterUri, setPosterUri] = useState<string | null>(type === "image" ? uri : null);

  useEffect(() => {
    if (type === "image") {
      setPosterUri(uri);
      return;
    }
    let cancelled = false;
    setPosterUri(null);
    getVideoPoster(uri).then((p) => {
      if (!cancelled) setPosterUri(p);
    });
    return () => {
      cancelled = true;
    };
  }, [uri, type]);

  if (!posterUri) {
    return (
      <View style={[StyleSheet.absoluteFill, s.placeholder]}>
        <FontAwesomeFreeSolid name="photo-film" size={16} color={colors.textMuted} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: posterUri }}
      style={s.image}
      contentFit="cover"
      onError={() => setPosterUri(null)}
    />
  );
});

const useStyles = makeStyles((colors) => ({
  // Rounded here rather than relying on the parent's overflow clip, which Android ignores on elevated cards.
  image: { width: "100%", height: "100%", borderRadius: radius.md },
  placeholder: {
    borderRadius: radius.md,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
}));
