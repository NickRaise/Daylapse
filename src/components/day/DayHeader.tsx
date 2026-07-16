import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme";

type Props = {
  formattedDate: string;
  dayName: string;
};

export function DayHeader({ formattedDate, dayName }: Props) {
  return (
    <View style={s.header}>
      <View>
        <Text style={s.dateText}>{formattedDate}</Text>
        <Text style={s.dayText}>{dayName}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 34,
    fontWeight: "bold",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  dayText: {
    fontFamily: "Caveat",
    fontSize: 22,
    color: colors.textSecondary,
  },
});
