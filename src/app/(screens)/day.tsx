import { colors } from "@/theme";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseDateKey } from "@/components/calendar/utils";
import { FontAwesomeFreeSolid } from "@react-native-vector-icons/fontawesome-free-solid";
import SuggestionSection from "@/components/sections/Suggestion";
import { quotes } from "@/data/quotes";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { MoodPicker, type Mood } from "@/components/journal/MoodPicker";
import useEntryStore from "@/store/entry.store";
import { MediaRepository } from "@/repositories/media.repository";
import type { Media } from "@/db/schema";

export default function DayScreen() {
  const { dateKey }: { dateKey: string } = useLocalSearchParams();
  const { dayName, formattedDate } = parseDateKey(dateKey as string);
  const router = useRouter();

  const currentId = useEntryStore((s) => s.currentId);
  const isLoading = useEntryStore((s) => s.isLoading);
  const currentJournalText = useEntryStore((s) => s.currentJournalText);
  const currentMood = useEntryStore((s) => s.currentMood);
  const createEntry = useEntryStore((s) => s.createEntry);
  const updateMood = useEntryStore((s) => s.updateMood);
  const saveJournal = useEntryStore((s) => s.saveJournal);

  // Local state only for the editor while it's open
  const [editingText, setEditingText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);

  const quote = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    [],
  );

  // Create or load the entry immediately on mount — screen already visible
  useEffect(() => {
    createEntry(dateKey);
  }, [dateKey]);

  // Load media whenever currentId becomes available or screen regains focus (return from camera)
  useFocusEffect(
    useCallback(() => {
      if (currentId !== null) {
        MediaRepository.getMediaByEntry(currentId).then(setMediaFiles);
      }
    }, [currentId]),
  );

  const handleOpenCamera = () => {
    router.push({ pathname: "/camera", params: { dateKey } });
  };

  const handleJournalOpen = () => {
    setEditingText(currentJournalText);
    setJournalOpen(true);
  };

  const handleJournalClose = () => {
    setJournalOpen(false);
    saveJournal(editingText);
  };

  const images = mediaFiles.filter((m) => m.type === "image");
  const videos = mediaFiles.filter((m) => m.type === "video");

  return (
    <View style={styles.root}>
      {/* Temporary video indicator — full video UI to be designed */}
      {videos.length > 0 && (
        <View style={styles.videoBanner}>
          <FontAwesomeFreeSolid
            name="film"
            size={11}
            color={colors.textPrimary}
          />
          <Text style={styles.videoBannerText}>
            {videos.length} video{videos.length > 1 ? "s" : ""} saved
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.dayText}>{dayName}</Text>
      </View>

      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>"{quote}"</Text>
      </View>

      <View style={styles.main}>
        {/* Media area */}
        {images.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
            contentContainerStyle={styles.imageScrollContent}
          >
            {images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.uri }}
                style={styles.imageThumbnail}
              />
            ))}
            <Pressable style={styles.addMoreButton} onPress={handleOpenCamera}>
              <FontAwesomeFreeSolid
                name="plus"
                size={14}
                color={colors.textPrimary}
              />
            </Pressable>
          </ScrollView>
        ) : (
          <Pressable style={styles.addMediaButton} onPress={handleOpenCamera}>
            <FontAwesomeFreeSolid
              name="plus"
              size={12}
              color={colors.textPrimary}
            />
            <Text style={styles.addMediaButtonText}>Add Memory</Text>
          </Pressable>
        )}

        {/* Journal — display from store, edit via local state */}
        <Pressable
          style={styles.journalInputButton}
          onPress={handleJournalOpen}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.placeholderPrimary} />
          ) : (
            <Text
              style={[
                styles.journalInputText,
                !!currentJournalText && styles.journalInputTextFilled,
              ]}
              numberOfLines={1}
            >
              {currentJournalText || "Tell today's story..."}
            </Text>
          )}
          <FontAwesomeFreeSolid
            name="edit"
            size={20}
            color={
              currentJournalText
                ? colors.textSecondary
                : colors.placeholderPrimary
            }
          />
        </Pressable>

        {/* Mood Picker — reads and writes store directly */}
        <MoodPicker value={currentMood as Mood | null} onChange={updateMood} />
      </View>

      <SuggestionSection dateKey={dateKey} />

      <JournalEditor
        visible={journalOpen}
        value={editingText}
        onChange={setEditingText}
        onClose={handleJournalClose}
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
  videoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bgSubtle,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  videoBannerText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: "500",
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
  imageScroll: {
    height: 150,
    width: "85%",
  },
  imageScrollContent: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  imageThumbnail: {
    width: 130,
    height: 150,
    borderRadius: 10,
    resizeMode: "cover",
  },
  addMoreButton: {
    width: 48,
    height: 150,
    backgroundColor: colors.bgSubtle,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
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
    minHeight: 40,
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
