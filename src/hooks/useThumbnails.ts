import { useEffect, useRef, useState } from "react";
import * as VideoThumbnails from "expo-video-thumbnails";

export const THUMB_COUNT = 10;

export function useThumbnails(videoUri: string, duration: number, viewportW: number) {
  const [thumbUris, setThumbUris] = useState<string[]>([]);
  const generatingRef = useRef(false);

  useEffect(() => {
    if (viewportW < 10 || !duration || !videoUri || generatingRef.current) return;
    generatingRef.current = true;
    const times = Array.from({ length: THUMB_COUNT }, (_, i) =>
      Math.round((i / (THUMB_COUNT - 1)) * duration * 1000),
    );
    Promise.all(
      times.map((t) =>
        VideoThumbnails.getThumbnailAsync(videoUri, { time: t, quality: 0.4 })
          .then((r) => r.uri)
          .catch(() => ""),
      ),
    ).then((uris) => {
      setThumbUris(uris.filter(Boolean));
      generatingRef.current = false;
    });
  }, [viewportW, duration, videoUri]);

  return { thumbUris };
}
