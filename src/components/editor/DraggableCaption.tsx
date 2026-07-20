import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

type Props = {
  text: string;
  frameWidth: number;
  frameHeight: number;
  /** When false the caption is rendered but not draggable. */
  draggable?: boolean;
};

export function DraggableCaption({ text, frameWidth, frameHeight, draggable = true }: Props) {
  const [pos, setPos] = useState({
    x: frameWidth / 2,
    y: frameHeight * 0.5,
  });
  const drag = useRef({ startTX: 0, startTY: 0, initX: 0, initY: 0 });
  const [measured, setMeasured] = useState({ w: 0, h: 0 });

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
      <Text style={s.text}>{text}</Text>
      {draggable && <View style={s.dragHint} pointerEvents="none" />}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dragHint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
});
