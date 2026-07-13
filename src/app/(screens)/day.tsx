import { colors } from "@/theme";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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

const MEDIA_HEIGHT = 300;
const H_PAD = 20;

export default function DayScreen() {
  const { dateKey }: { dateKey: string } = useLocalSearchParams();
  const { dayName, formattedDate } = parseDateKey(dateKey as string);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

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
  const [activePage, setActivePage] = useState(0);

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

  const handlePageScroll = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActivePage(page);
  };

  // ── Media area ─────────────────────────────────────────────────────────────

  const mediaArea =
    mediaFiles.length === 0 ? (
      // Empty state — single large card
      <Pressable style={styles.emptyCard} onPress={handleOpenCamera}>
        <View style={styles.emptyIconWrap}>
          <FontAwesomeFreeSolid
            name="plus"
            size={18}
            color={colors.textMuted}
          />
        </View>
        <Text style={styles.emptyLabel}>Add a memory</Text>
        <Text style={styles.emptyHint}>Photo or video</Text>
      </Pressable>
    ) : (
      <View>
        {/* Pager — one card per page, full screen width so pagingEnabled snaps cleanly */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handlePageScroll}
          style={{ width: screenWidth, height: MEDIA_HEIGHT }}
        >
          {mediaFiles.map((item) => (
            <View
              key={item.id}
              style={{
                width: screenWidth,
                height: MEDIA_HEIGHT,
                paddingHorizontal: H_PAD,
              }}
            >
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.mediaCard}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.mediaCard, styles.videoCard]}>
                  <View style={styles.playBtn}>
                    <FontAwesomeFreeSolid
                      name="play"
                      size={20}
                      color={colors.textPrimary}
                      style={{ marginLeft: 2 }}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Page dots */}
        <View style={styles.dots}>
          {mediaFiles.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activePage && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    );

  // ── Render ──────────────────────────────────────────────────────────────────

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
      {mediaArea}

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

      {/* FAB — only when media already exists */}
      {mediaFiles.length > 0 && (
        <Pressable style={styles.fab} onPress={handleOpenCamera}>
          <FontAwesomeFreeSolid
            name="plus"
            size={14}
            color={colors.textOnAccent}
          />
          <Text style={styles.fabLabel}>Add media</Text>
        </Pressable>
      )}

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

  // ── Media — empty state ────────────────────────────────────────────────────
  emptyCard: {
    marginHorizontal: H_PAD,
    height: MEDIA_HEIGHT,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.borderDark,
    backgroundColor: colors.bgSubtle,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 12,
  },

  // ── Media — pager cards ────────────────────────────────────────────────────
  mediaCard: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  videoCard: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Dots ───────────────────────────────────────────────────────────────────
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderDark,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.textSecondary,
  },

  // ── Journal ────────────────────────────────────────────────────────────────
  journalRow: {
    marginHorizontal: H_PAD,
    marginTop: 10,
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

  // ── FAB ────────────────────────────────────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 50,
    right: H_PAD,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabLabel: {
    color: colors.textOnAccent,
    fontSize: 14,
    fontWeight: "600",
  },
});
