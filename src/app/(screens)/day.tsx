import { colors } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { parseDateKey } from "@/components/calendar/utils";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import SuggestionSection from "@/components/sections/Suggestion";

export default function DayScreen() {
  const { dateKey }: { dateKey: string } = useLocalSearchParams();
  const { dayName, formattedDate } = parseDateKey(dateKey as string);
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.dayText}>{dayName}</Text>
      </View>

      <View style={styles.main}>
        {/* Add Media Trigger */}
        <Pressable
          style={styles.addMediaButton}
          onPress={() => console.log("Add Media pressed")}
        >
          <FontAwesomeFreeSolid
            name="plus"
            size={12}
            color={colors.textPrimary}
          />
          <Text style={styles.addMediaButtonText}>Add Media</Text>
        </Pressable>
      </View>
      {/* Suggestion Box */}
      <SuggestionSection dateKey={dateKey} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  header: {
    alignSelf: "flex-start",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: -8,
  },
  dayText: {
    fontFamily: "Caveat",
    fontSize: 25,
    color: colors.textSecondary,
  },
  addMediaButton: {
    height: 100,
    width: "85%",
    color: colors.textPrimary,
    backgroundColor: colors.bgSubtle,
    borderRadius: 12,
    borderStyle: "dotted",
    borderWidth: 2,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  addMediaButtonText: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
});
