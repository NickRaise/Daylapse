import { colors, spacing } from "@/theme";
import {
  ActivityIndicator,
  Pressable,
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
import { AddMemoryCard } from "@/components/day/AddMemoryCard";
import { AddMediaFab } from "@/components/day/AddMediaFab";
import { MediaPager } from "@/components/day/MediaPager";

const H_PAD = 20;

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

  const [editingText, setEditingText] = useState("");
  const [journalOpen, setJournalOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);

  const quote = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    [],
  );

  useEffect(() => {
    createEntry(dateKey);
  }, [dateKey]);

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

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.dayText}>{dayName}</Text>
        </View>
      </View>

      {/* Quote */}
      <Text style={styles.quoteText}>"{quote}"</Text>

      {/* Media */}
      <View style={styles.mediaWrap}>
        {mediaFiles.length === 0 ? (
          <View style={styles.addMemoryWrap}>
            <AddMemoryCard onPress={handleOpenCamera} />
          </View>
        ) : (
          <MediaPager mediaFiles={mediaFiles} onAddPress={handleOpenCamera} />
        )}
      </View>

      {/* Journal */}
      <Pressable style={styles.journalRow} onPress={handleJournalOpen}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.placeholderPrimary} />
        ) : (
          <Text
            style={[
              styles.journalText,
              !!currentJournalText && styles.journalTextFilled,
            ]}
            numberOfLines={2}
          >
            {currentJournalText || "Tell today's story…"}
          </Text>
        )}
        <FontAwesomeFreeSolid
          name="edit"
          size={16}
          color={
            currentJournalText
              ? colors.textSecondary
              : colors.placeholderPrimary
          }
        />
      </Pressable>

      {/* Mood */}
      <View style={styles.moodWrap}>
        <MoodPicker value={currentMood as Mood | null} onChange={updateMood} />
      </View>

      <View style={{ flex: 1 }} />

      <SuggestionSection dateKey={dateKey} />

      {mediaFiles.length > 0 && <AddMediaFab onPress={handleOpenCamera} />}

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
    paddingTop: 44,
    paddingBottom: 24,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: H_PAD,
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

  // ── Quote ──────────────────────────────────────────────────────────────────
  quoteText: {
    fontFamily: "Caveat",
    fontSize: 17,
    color: colors.textMuted,
    paddingHorizontal: H_PAD,
    marginBottom: 12,
    lineHeight: 22,
  },

  // ── Media area ─────────────────────────────────────────────────────────────
  mediaWrap: {
    marginTop: spacing[10],
    marginBottom: spacing[4],
  },
  addMemoryWrap: {
    marginHorizontal: H_PAD,
    marginVertical: 10,
  },

  // ── Journal ────────────────────────────────────────────────────────────────
  journalRow: {
    marginHorizontal: H_PAD,
    marginVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgSubtle,
    minHeight: 48,
  },
  journalText: {
    flex: 1,
    color: colors.placeholderPrimary,
    fontStyle: "italic",
    fontSize: 14,
    lineHeight: 20,
  },
  journalTextFilled: {
    color: colors.textPrimary,
    fontStyle: "normal",
  },

  // ── Mood ───────────────────────────────────────────────────────────────────
  moodWrap: {
    marginHorizontal: H_PAD,
    marginTop: 12,
  },
});
