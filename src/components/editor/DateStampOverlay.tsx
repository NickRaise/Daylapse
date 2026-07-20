import { StyleSheet, Text, View } from "react-native";
import type { DateStampFormat, DateStampPosition } from "@/types";

type Props = {
  dateKey: string; // YYYY-MM-DD
  position: DateStampPosition;
  format: DateStampFormat;
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateKey: string, fmt: DateStampFormat): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const mon = MONTH_ABBR[month - 1] ?? "";
  if (fmt === "DD MMM") return `${day} ${mon}`;
  if (fmt === "DD MMM YYYY") return `${day} ${mon} ${year}`;
  return `${mon} ${day}, ${year}`;
}

const POSITION_STYLE: Record<DateStampPosition, object> = {
  "top-left": { top: 12, left: 12 },
  "top-right": { top: 12, right: 12 },
  "bottom-left": { bottom: 12, left: 12 },
  "bottom-right": { bottom: 12, right: 12 },
};

export function DateStampOverlay({ dateKey, position, format }: Props) {
  const label = formatDate(dateKey, format);

  return (
    <View style={[s.root, POSITION_STYLE[position]]} pointerEvents="none">
      <Text style={s.text}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
    fontFamily: "Caveat",
  },
});
