import React from "react";
import Svg, { G, Circle, Ellipse, Path } from "react-native-svg";

export interface EmojiProps {
  size?: number;
  faceColor?: string; // main fill of the face
  shadowColor?: string; // offset blob behind the face
  ringColor?: string; // hand-drawn outline ring + mouth strokes
  dotColor?: string; // eyes and small dark doodles
}

const DEFAULT_SIZE = 160;
const CREAM = "#f2ede6";
const INK = "#1f1f1f";

const strokeProps = {
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Base({
  faceColor,
  shadowColor,
  ringColor,
}: {
  faceColor: string;
  shadowColor: string;
  ringColor: string;
}) {
  return (
    <>
      <Ellipse cx={6} cy={10} rx={46} ry={45} fill={shadowColor} />
      <Circle cx={0} cy={2} r={44} fill={faceColor} />
      <Circle
        cx={-3}
        cy={-2}
        r={45}
        fill="none"
        stroke={ringColor}
        strokeWidth={9}
      />
    </>
  );
}

export function HappyEmoji({
  size = DEFAULT_SIZE,
  faceColor = "#f6c3cb",
  shadowColor = "#f3aab6",
  ringColor = CREAM,
  dotColor = INK,
}: EmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G x={76} y={86} {...strokeProps}>
        <Base
          faceColor={faceColor}
          shadowColor={shadowColor}
          ringColor={ringColor}
        />
        <Circle cx={-16} cy={-8} r={5} fill={dotColor} />
        <Circle cx={14} cy={-8} r={5} fill={dotColor} />
        <Path
          d="M-20 10 Q-2 26 18 8"
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
        />
        <Path
          d="M46 -52 l0 -14 l16 -6 l0 14"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Circle cx={44} cy={-50} r={7} fill={dotColor} />
        <Circle cx={62} cy={-58} r={7} fill={dotColor} />
      </G>
    </Svg>
  );
}

export function CalmEmoji({
  size = DEFAULT_SIZE,
  faceColor = "#e39c7e",
  shadowColor = "#d98a6d",
  ringColor = CREAM,
  dotColor = INK,
}: EmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G x={76} y={88} {...strokeProps}>
        <Base
          faceColor={faceColor}
          shadowColor={shadowColor}
          ringColor={ringColor}
        />
        <Path
          d="M-24 -8 Q-16 -18 -8 -8"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Path
          d="M10 -8 Q18 -18 26 -8"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Path
          d="M-12 12 Q0 22 14 12"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Ellipse
          cx={56}
          cy={-56}
          rx={13}
          ry={11}
          fill="#f6c3cb"
          stroke={dotColor}
          strokeWidth={7}
          transform="rotate(-15 56 -56)"
        />
      </G>
    </Svg>
  );
}

export function NeutralEmoji({
  size = DEFAULT_SIZE,
  faceColor = "#f6c3cb",
  shadowColor = "#f3aab6",
  ringColor = CREAM,
  dotColor = INK,
}: EmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G x={80} y={84} {...strokeProps}>
        <Base
          faceColor={faceColor}
          shadowColor={shadowColor}
          ringColor={ringColor}
        />
        <Circle cx={-15} cy={-8} r={5} fill={dotColor} />
        <Circle cx={15} cy={-8} r={5} fill={dotColor} />
        <Path
          d="M-16 14 L16 14"
          fill="none"
          stroke={ringColor}
          strokeWidth={8}
        />
      </G>
    </Svg>
  );
}

export function SadEmoji({
  size = DEFAULT_SIZE,
  faceColor = "#e0a488",
  shadowColor = "#d69173",
  ringColor = CREAM,
  dotColor = INK,
}: EmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G x={72} y={84} {...strokeProps}>
        <Base
          faceColor={faceColor}
          shadowColor={shadowColor}
          ringColor={ringColor}
        />
        <Circle cx={-16} cy={-12} r={5} fill={dotColor} />
        <Circle cx={16} cy={-12} r={5} fill={dotColor} />
        <Path
          d="M-14 20 Q-6 8 2 16 Q10 24 18 12"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Path
          d="M56 -28 q-8 8 0 16 q8 8 -2 16"
          fill="none"
          stroke={ringColor}
          strokeWidth={6}
        />
        <Path
          d="M70 -4 q-6 7 0 13 q6 7 -2 13"
          fill="none"
          stroke={ringColor}
          strokeWidth={6}
        />
      </G>
    </Svg>
  );
}

export function AngryEmoji({
  size = DEFAULT_SIZE,
  faceColor = "#f6c3cb",
  shadowColor = "#f3aab6",
  ringColor = CREAM,
  dotColor = INK,
}: EmojiProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160">
      <G x={76} y={88} {...strokeProps}>
        <Base
          faceColor={faceColor}
          shadowColor={shadowColor}
          ringColor={ringColor}
        />
        <Path
          d="M-26 -20 L-6 -12"
          fill="none"
          stroke={dotColor}
          strokeWidth={7}
        />
        <Path
          d="M26 -20 L6 -12"
          fill="none"
          stroke={dotColor}
          strokeWidth={7}
        />
        <Circle cx={-16} cy={-4} r={5} fill={dotColor} />
        <Circle cx={16} cy={-4} r={5} fill={dotColor} />
        <Path
          d="M-14 22 Q0 10 14 22"
          fill="none"
          stroke={ringColor}
          strokeWidth={7}
        />
        <Path
          d="M48 -58 l10 10 M64 -66 l4 12"
          fill="none"
          stroke={ringColor}
          strokeWidth={6}
        />
      </G>
    </Svg>
  );
}
