import { colors } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { parseDateKey } from "@/components/calendar/utils";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import SuggestionSection from "@/components/sections/Suggestion";
import { quotes } from "@/data/quotes";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { MoodPicker, type Mood } from "@/components/journal/MoodPicker";
import { EntryRepository } from "@/repositories/entry.repository";
import { MediaRepository } from "@/repositories/media.repository";

export default function DayScreen() {
  const { dateKey }: { dateKey: string } = useLocalSearchParams();
  const { dayName, formattedDate } = parseDateKey(dateKey as string);
  const router = useRouter();

  const [journalText, setJournalText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);

  const quote = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    [],
  );

  useEffect(() => {
    // If media uri present in global state
    // Create a new entry for the day
    // const entry = async () => {
    //   // Dummy implementation for entry creation
    //   console.log("Running the dummy storage function for entry creation...");
    //   const URI =
    //     "file:///storage/emulated/0/DCIM/e0550b2e-795d-4a0f-9218-b5f699cf8314.jpg";
    //   const newEntryId = await EntryRepository.createEntry({
    //     dateKey,
    //     journal: journalText,
    //     mood: mood || "neutral", // Default mood if not set
    //   });
    //   console.log("New entry created with ID:", newEntryId);
    //   console.log("Fetched entry:", entry);
    //   const newMediaId = await MediaRepository.addMedia({
    //     entryId: newEntryId!,
    //     type: "image",
    //     uri: URI,
    //     order: 0,
    //   });
    //   console.log("Media added for entry ID:", newEntryId);
    //   if (newEntryId) {
    //     const entry = await EntryRepository.getEntryById(newEntryId);
    //     console.log("Fetched entry:", entry);
    //   }
    // };
    // entry();
  }, []);

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

      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>"{quote}"</Text>
      </View>

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

        {/* Mood Picker */}
        <MoodPicker value={mood} onChange={setMood} />
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
    gap: 50,
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
  quoteContainer: {
    paddingTop: 28,
    paddingHorizontal: 8,
  },
  quoteText: {
    fontFamily: "Caveat",
    fontSize: 21,
    color: colors.textSecondary,
    lineHeight: 28,
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
