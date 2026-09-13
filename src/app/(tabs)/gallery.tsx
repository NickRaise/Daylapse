import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { File } from "expo-file-system";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import { MontageRepository } from "@/repositories/montage.repository";
import type { Montage } from "@/db/schema";
import { MontageCard } from "@/components/montage/MontageCard";
import { CompileSheet, type CompileRange } from "@/components/montage/CompileSheet";
import { MediaLightbox } from "@/components/day/MediaLightbox";
import { compileMontage, type CompileProgress } from "@/service/montage.service";

type Selected = { uri: string; type: "image" | "video" } | null;

// Same tile width as the "recent days" strip on Home, for a consistent thumbnail size across the app.
const GRID_PADDING = spacing[4];
const GRID_GAP = spacing[3];
const GRID_COLUMNS = 3;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - 2 * GRID_PADDING - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS,
);

export default function Gallery() {
  const [montages, setMontages] = useState<Montage[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [progress, setProgress] = useState<CompileProgress | null>(null);

  // A montage whose output file is missing (e.g. a compile that failed partway) shouldn't linger as a broken card.
  const refresh = useCallback(async () => {
    const all = await MontageRepository.getAllMontages();
    const valid: Montage[] = [];
    for (const m of all) {
      if (new File(m.outputUri).exists) {
        valid.push(m);
      } else {
        MontageRepository.deleteMontage(m.id);
      }
    }
    setMontages(valid);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  function handleLongPress(montage: Montage) {
    Alert.alert("Delete montage?", montage.title ?? `${montage.dateRangeStart} – ${montage.dateRangeEnd}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await MontageRepository.deleteMontage(montage.id);
          refresh();
        },
      },
    ]);
  }

  async function handleCompile(range: CompileRange) {
    setSheetVisible(false);
    setProgress({ current: 0, total: 1, stage: "converting" });
    try {
      await compileMontage(range.start, range.end, range.title, setProgress);
      refresh();
    } catch (error) {
      console.error("[gallery] compile failed:", error);
    } finally {
      setProgress(null);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Montages</Text>
        <Text style={s.headerSubtitle}>
          {montages.length === 0
            ? "Your compiled videos will show up here"
            : `${montages.length} compiled video${montages.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      {montages.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <FontAwesomeFreeSolid name="clapperboard" size={26} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No montages yet</Text>
          <Text style={s.emptyText}>
            Compile your daily photos and videos into one shareable video.
          </Text>
          <Pressable style={s.emptyCta} onPress={() => setSheetVisible(true)}>
            <Text style={s.emptyCtaText}>Compile your first montage</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={s.list}
          data={montages}
          keyExtractor={(m) => String(m.id)}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => (
            <MontageCard
              montage={item}
              width={CARD_WIDTH}
              onPress={(m) => setSelected({ uri: m.outputUri, type: "video" })}
              onLongPress={handleLongPress}
            />
          )}
        />
      )}

      <Pressable style={s.fab} onPress={() => setSheetVisible(true)}>
        <FontAwesomeFreeSolid name="plus" size={22} color={colors.textOnAccent} />
      </Pressable>

      <CompileSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCompile={handleCompile}
      />

      <MediaLightbox selected={selected} onClose={() => setSelected(null)} />

      {progress && (
        <View style={s.progressOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.progressText}>
            {progress.stage === "converting"
              ? `Preparing ${progress.current}/${progress.total}…`
              : "Merging…"}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: 56,
    paddingBottom: spacing[3],
    gap: 2,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    gap: spacing[2],
    marginBottom: spacing[10],
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: spacing[4],
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing[5],
    paddingVertical: 12,
  },
  emptyCtaText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textOnAccent,
  },
  list: { flex: 1 },
  grid: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  row: {
    gap: spacing[3],
  },
  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  progressOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: "#fff",
  },
});
