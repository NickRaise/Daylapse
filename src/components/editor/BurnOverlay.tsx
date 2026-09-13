import { StyleSheet, Text, View } from "react-native";
import type { CaptionStyle, DateStampFormat } from "@/types";
import { CAPTION_SIZE_FONT } from "@/components/editor/DraggableCaption";

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateKey: string, fmt: DateStampFormat): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const mon = MONTH_ABBR[month - 1] ?? "";
  if (fmt === "DD MMM") return `${day} ${mon}`;
  if (fmt === "DD MMM YYYY") return `${day} ${mon} ${year}`;
  return `${mon} ${day}, ${year}`;
}

type Props = {
  width: number;
  height: number;
  scale: number;
  captionText: string;
  captionPos: { left: number; top: number } | null;
  captionStyle: CaptionStyle;
  dateStampEnabled: boolean;
  dateKey: string;
  dateFormat: DateStampFormat;
};

// Off-screen render of exactly what's burned into the exported media — sized to the media's own
// native resolution and captured via captureRef, then composited onto the video/photo with FFmpeg.
export function BurnOverlay({
  width,
  height,
  scale,
  captionText,
  captionPos,
  captionStyle,
  dateStampEnabled,
  dateKey,
  dateFormat,
}: Props) {
  return (
    <View style={{ width, height }}>
      {captionText && captionPos && (
        <View
          style={[
            s.captionWrapper,
            {
              left: captionPos.left,
              top: captionPos.top,
              paddingHorizontal: 10 / scale,
              paddingVertical: 5 / scale,
              borderRadius: 6 / scale,
              backgroundColor: captionStyle.bgColor,
            },
          ]}
        >
          <Text
            style={[
              s.captionText,
              { color: captionStyle.textColor, fontSize: CAPTION_SIZE_FONT[captionStyle.size] / scale },
            ]}
          >
            {captionText}
          </Text>
        </View>
      )}

      {dateStampEnabled && (
        <View
          style={[
            s.dateWrapper,
            {
              bottom: 12 / scale,
              right: 12 / scale,
              paddingHorizontal: 8 / scale,
              paddingVertical: 4 / scale,
              borderRadius: 4 / scale,
              backgroundColor: captionStyle.bgColor,
            },
          ]}
        >
          <Text
            style={[
              s.dateText,
              { color: captionStyle.textColor, fontSize: 11 / scale },
            ]}
          >
            {formatDate(dateKey, dateFormat)}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  captionWrapper: { position: "absolute" },
  captionText: { fontWeight: "600", letterSpacing: 0.3 },
  dateWrapper: { position: "absolute" },
  dateText: { fontWeight: "600", letterSpacing: 0.5, fontFamily: "Caveat" },
});
