import { colors } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { parseDateKey } from "@/components/calendar/utils";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import SuggestionSection from "@/components/sections/Suggestion";
import { quotes } from "@/data/quotes";
import { JournalEditor } from "@/components/journal/JournalEditor";

export default function DayScreen() {
  const { dateKey }: { dateKey: string } = useLocalSearchParams();
  const { dayName, formattedDate } = parseDateKey(dateKey as string);
  const router = useRouter();

  const [journalText, setJournalText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);

  const handleOpenCurrentDay = () => {
    // redirect to camera / Gallery
    router.push({
      pathname: "/camera",
      params: {
        dateKey,
      },
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.dayText}>{dayName}</Text>
      </View>

      {/* TODO: Random Quote */}
      {/* <Text>{quotes[Math.floor(Math.random() * quotes.length)]}</Text> */}

      <View style={styles.main}>
        {/* Add Media Trigger */}
        <Pressable style={styles.addMediaButton} onPress={handleOpenCurrentDay}>
          <FontAwesomeFreeSolid
            name="plus"
            size={12}
            color={colors.textPrimary}
          />
          <Text style={styles.addMediaButtonText}>Add Memory</Text>
        </Pressable>

        {/* Daily Journal */}
        <Pressable
          style={styles.journalInputButton}
          onPress={() => setJournalOpen(true)}
        >
          <Text
            style={[
              styles.journalInputText,
              !!journalText && styles.journalInputTextFilled,
            ]}
            numberOfLines={1}
          >
            {journalText || "Tell today's story..."}
          </Text>
          <FontAwesomeFreeSolid
            name="edit"
            size={20}
            color={
              journalText ? colors.textSecondary : colors.placeholderPrimary
            }
          />
        </Pressable>
      </View>

      {/* Suggestion Box */}
      <SuggestionSection dateKey={dateKey} />

      <JournalEditor
        visible={journalOpen}
        value={journalText}
        onChange={setJournalText}
        onClose={() => setJournalOpen(false)}
        dateLabel={formattedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignSelf: "flex-start",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
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
    height: 150,
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
  journalInputButton: {
    width: "85%",
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    padding: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  journalInputText: {
    color: colors.placeholderPrimary,
    fontStyle: "italic",
    flex: 1,
  },
  journalInputTextFilled: {
    color: colors.textPrimary,
    fontStyle: "normal",
  },
});
