import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";
import type { CaptionPosition, CaptionSize } from "@/types";

const SIZE_FONT: Record<CaptionSize, number> = { sm: 12, md: 16, lg: 22 };
const MARGIN = 24;

function presetToCoords(pos: CaptionPosition, fw: number, fh: number) {
  const parts = pos.split("-");
  const vert  = parts[0];
  const horiz = parts.length > 1 ? parts[1] : "center";
  const x = horiz === "left" ? MARGIN : horiz === "right" ? fw - MARGIN : fw / 2;
  const y = vert  === "top"  ? MARGIN : vert  === "bottom" ? fh - MARGIN : fh / 2;
  return { x, y };
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
}: Props) {
  const [pos, setPos] = useState(() =>
    presetToCoords(position, frameWidth, frameHeight),
  );
  const drag = useRef({ startTX: 0, startTY: 0, initX: 0, initY: 0 });
  const [measured, setMeasured] = useState({ w: 0, h: 0 });

  // Snap to preset when user picks a new position
  useEffect(() => {
    setPos(presetToCoords(position, frameWidth, frameHeight));
  }, [position, frameWidth, frameHeight]);

  if (!text) return null;

  const halfW = measured.w / 2;
  const halfH = measured.h / 2;

  return (
    <View
      style={[
        s.wrapper,
        {
          position: "absolute",
          left: pos.x - halfW,
          top: pos.y - halfH,
          backgroundColor: bgColor,
        },
      ]}
      onLayout={(e) => {
        setMeasured({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
      }}
      onStartShouldSetResponder={() => draggable}
      onMoveShouldSetResponder={() => draggable}
      onResponderGrant={(e) => {
        drag.current = {
          startTX: e.nativeEvent.pageX,
          startTY: e.nativeEvent.pageY,
          initX: pos.x,
          initY: pos.y,
        };
      }}
      onResponderMove={(e) => {
        const dx = e.nativeEvent.pageX - drag.current.startTX;
        const dy = e.nativeEvent.pageY - drag.current.startTY;
        setPos({
          x: Math.max(halfW, Math.min(frameWidth - halfW, drag.current.initX + dx)),
          y: Math.max(halfH, Math.min(frameHeight - halfH, drag.current.initY + dy)),
        });
      }}
    >
      <Text style={[s.text, { color: textColor, fontSize: SIZE_FONT[size] }]}>
        {text}
      </Text>
      {draggable && <View style={s.dragHint} pointerEvents="none" />}
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
  dragHint: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
});
