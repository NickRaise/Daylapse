import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CaptionPosition, CaptionSize } from "@/types";

export const CAPTION_SIZE_FONT: Record<CaptionSize, number> = { sm: 12, md: 16, lg: 22 };
export const CAPTION_MARGIN = 24;
const SIZE_FONT = CAPTION_SIZE_FONT;
const MARGIN = CAPTION_MARGIN;

// Computed straight from the current (possibly still-settling) measured size,
// in the same render pass — no follow-up "correction" render, so growing text
// never flashes at the wrong spot before snapping into place.
function presetLeftTop(
  pos: CaptionPosition,
  fw: number,
  fh: number,
  w: number,
  h: number,
) {
  const parts = pos.split("-");
  const vert  = parts[0];
  const horiz = parts.length > 1 ? parts[1] : "center";
  const left = horiz === "left" ? MARGIN : horiz === "right" ? fw - MARGIN - w : (fw - w) / 2;
  const top  = vert  === "top"  ? MARGIN : vert  === "bottom" ? fh - MARGIN - h : (fh - h) / 2;
  return { left, top };
}

type Props = {
  text: string;
  frameWidth: number;
  frameHeight: number;
  textColor?: string;
  bgColor?: string;
  size?: CaptionSize;
  position?: CaptionPosition;
  draggable?: boolean;
  /** Bump this (e.g. a counter) to snap the caption back to its preset position. */
  resetSignal?: number;
  /** Reports the caption's resolved on-screen rect, so it can be re-mapped onto the exported media. */
  onRectChange?: (rect: { left: number; top: number; width: number; height: number }) => void;
};

export function DraggableCaption({
  text,
  frameWidth,
  frameHeight,
  textColor = "#FFFFFF",
  bgColor = "rgba(0,0,0,0.5)",
  size = "md",
  position = "bottom-center",
  draggable = true,
  resetSignal,
  onRectChange,
}: Props) {
  const [measured, setMeasured] = useState({ w: 0, h: 0 });
  // null while following the preset corner; set once the user drags it free.
  const [dragPos, setDragPos] = useState<{ left: number; top: number } | null>(null);
  const drag = useRef({ startTX: 0, startTY: 0, initLeft: 0, initTop: 0 });

  // Snap back to following the preset when the user picks a new one, or
  // resetSignal is bumped (e.g. from a "reset position" button).
  useEffect(() => {
    setDragPos(null);
  }, [position, frameWidth, frameHeight, resetSignal]);

  const { left, top } =
    dragPos ?? presetLeftTop(position, frameWidth, frameHeight, measured.w, measured.h);

  useEffect(() => {
    if (text && measured.w > 0 && measured.h > 0) {
      onRectChange?.({ left, top, width: measured.w, height: measured.h });
    }
  }, [text, left, top, measured.w, measured.h]);

  if (!text) return null;

  return (
    <View
      style={[s.wrapper, { position: "absolute", left, top, backgroundColor: bgColor }]}
      onLayout={(e) => {
        setMeasured({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
      }}
      onStartShouldSetResponder={() => draggable}
      onMoveShouldSetResponder={() => draggable}
      onResponderGrant={(e) => {
        drag.current = {
          startTX: e.nativeEvent.pageX,
          startTY: e.nativeEvent.pageY,
          initLeft: left,
          initTop: top,
        };
      }}
      onResponderMove={(e) => {
        const dx = e.nativeEvent.pageX - drag.current.startTX;
        const dy = e.nativeEvent.pageY - drag.current.startTY;
        setDragPos({
          left: Math.max(0, Math.min(frameWidth - measured.w, drag.current.initLeft + dx)),
          top: Math.max(0, Math.min(frameHeight - measured.h, drag.current.initTop + dy)),
        });
      }}
    >
      <Text style={[s.text, { color: textColor, fontSize: SIZE_FONT[size] }]}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  text: {
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
