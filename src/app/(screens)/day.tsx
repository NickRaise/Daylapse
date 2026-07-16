import { colors, spacing } from "@/theme";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { parseDateKey } from "@/components/calendar/utils";
import SuggestionSection from "@/components/sections/Suggestion";
import { quotes } from "@/data/quotes";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { MoodPicker, type Mood } from "@/components/journal/MoodPicker";
import useEntryStore from "@/store/entry.store";
import { AddMemoryCard } from "@/components/day/AddMemoryCard";
import { AddMediaFab } from "@/components/day/AddMediaFab";
import { MediaPager } from "@/components/day/MediaPager";
import { ReorderModal } from "@/components/day/ReorderModal";
import { DayHeader } from "@/components/day/DayHeader";
import { DayJournalRow } from "@/components/day/DayJournalRow";
import { useEntryMedia } from "@/hooks/useEntryMedia";
import { useJournalEditor } from "@/hooks/useJournalEditor";

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

  const { mediaFiles, reorderVisible, setReorderVisible, handleDeleteMedia, handleSaveOrder } =
    useEntryMedia(currentId);
  const { editingText, setEditingText, journalOpen, openJournal, closeJournal } =
    useJournalEditor(currentJournalText, saveJournal);

  const quote = useMemo(
    () => quotes[Math.floor(Math.random() * quotes.length)],
    [],
  );

  useEffect(() => {
    createEntry(dateKey);
  }, [dateKey]);

  const handleOpenCamera = () => {
    router.push({ pathname: "/camera", params: { dateKey } });
  };

  return (
    <View style={styles.root}>
      <DayHeader formattedDate={formattedDate} dayName={dayName} />

      {/* Quote */}
      <Text style={styles.quoteText}>"{quote}"</Text>

      {/* Media */}
      {mediaFiles.length === 0 ? (
        <View style={styles.emptyMediaWrap}>
          <AddMemoryCard
            onPress={handleOpenCamera}
            style={styles.emptyMemoryCard}
          />
        </View>
      ) : (
        <View style={styles.mediaWrap}>
          <MediaPager
            mediaFiles={mediaFiles}
            onAddPress={handleOpenCamera}
            onDelete={handleDeleteMedia}
            onOpenReorder={() => setReorderVisible(true)}
          />
        </View>
      )}

      <DayJournalRow
        text={currentJournalText}
        isLoading={isLoading}
        onPress={openJournal}
      />

      {/* Mood */}
      <View style={styles.moodWrap}>
        <MoodPicker value={currentMood as Mood | null} onChange={updateMood} />
      </View>

      <View style={{ flex: 1 }} />

      <SuggestionSection dateKey={dateKey} />

      {mediaFiles.length > 0 && <AddMediaFab onPress={handleOpenCamera} />}

      <ReorderModal
        visible={reorderVisible}
        mediaFiles={mediaFiles}
        onSave={handleSaveOrder}
        onCancel={() => setReorderVisible(false)}
      />

      <JournalEditor
        visible={journalOpen}
        value={editingText}
        onChange={setEditingText}
        onClose={closeJournal}
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

  // ── Quote ──────────────────────────────────────────────────────────────────
  quoteText: {
    fontFamily: "Caveat",
    fontSize: 17,
    color: colors.textSecondary,
    paddingHorizontal: H_PAD,
    marginTop: spacing[3],
    marginBottom: spacing[10],
    lineHeight: 22,
  },

  // ── Media area ─────────────────────────────────────────────────────────────
  mediaWrap: {
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  emptyMediaWrap: {
    marginHorizontal: H_PAD,
    marginTop: 80,
    marginBottom: 32,
  },
  emptyMemoryCard: {
    height: 160,
  },


  // ── Mood ───────────────────────────────────────────────────────────────────
  moodWrap: {
    marginHorizontal: H_PAD,
    marginTop: 12,
  },
});
