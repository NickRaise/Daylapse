import { StyleSheet, Text, View } from "react-native";
import type { DateStampFormat } from "@/types";

type Props = {
  dateKey: string;
  format: DateStampFormat;
  textColor?: string;
  bgColor?: string;
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatDate(dateKey: string, fmt: DateStampFormat): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const mon = MONTH_ABBR[month - 1] ?? "";
  if (fmt === "DD MMM")      return `${day} ${mon}`;
  if (fmt === "DD MMM YYYY") return `${day} ${mon} ${year}`;
  return `${mon} ${day}, ${year}`;
}

export function DateStampOverlay({
  dateKey,
  format,
  textColor = "#FFFFFF",
  bgColor = "rgba(0,0,0,0.45)",
}: Props) {
  return (
    // Position is always bottom-right — not user-configurable
    <View style={[s.root, { backgroundColor: bgColor }]} pointerEvents="none">
      <Text style={[s.text, { color: textColor }]}>{formatDate(dateKey, format)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "Caveat",
  },
});
