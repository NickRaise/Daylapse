import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { File } from "expo-file-system";
import * as MediaLibrary from "expo-media-library/legacy";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { MontageRepository } from "@/repositories/montage.repository";
import type { Montage } from "@/db/schema";
import { MontageCard } from "@/components/montage/MontageCard";
import { montageLabelText } from "@/components/montage/montageLabel";
import { CompileSheet, type CompileRange } from "@/components/montage/CompileSheet";
import { MediaLightbox } from "@/components/day/MediaLightbox";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
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
  const s = useStyles();
  const colors = useColors();
  const [montages, setMontages] = useState<Montage[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [progress, setProgress] = useState<CompileProgress | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions({ writeOnly: true });
  const aliveRef = useRef(true);
  useEffect(() => () => {
    aliveRef.current = false;
  }, []);

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
    if (aliveRef.current) setMontages(valid);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => setSelectedIds([]);
    }, [refresh]),
  );

  const selectionMode = selectedIds.length > 0;
  const singleSelected =
    selectedIds.length === 1 ? montages.find((m) => m.id === selectedIds[0]) : undefined;

  // Stable identities keep the memoised cards from all re-rendering on every tap.
  const toggleSelected = useCallback((montage: Montage) => {
    setSelectedIds((ids) =>
      ids.includes(montage.id) ? ids.filter((id) => id !== montage.id) : [...ids, montage.id],
    );
  }, []);

  const handlePress = useCallback(
    (montage: Montage) => {
      if (selectionMode) return toggleSelected(montage);
      setSelected({ uri: montage.outputUri, type: "video" });
    },
    [selectionMode, toggleSelected],
  );

  async function handleDeleteSelected() {
    setConfirmDelete(false);
    for (const id of selectedIds) await MontageRepository.deleteMontage(id);
    setSelectedIds([]);
    refresh();
  }

  // "Export" copies the compiled video into the device's own photo gallery — the app never had a way to get one out.
  async function handleExportSelected() {
    if (!mediaPermission?.granted) {
      const result = await requestMediaPermission();
      if (!result.granted) {
        Alert.alert("Permission needed", "Allow media access to keep your montages in your gallery.");
        return;
      }
    }
    const chosen = montages.filter((m) => selectedIds.includes(m.id));
    setExporting(true);
    try {
      for (const montage of chosen) await MediaLibrary.createAssetAsync(montage.outputUri);
      setSelectedIds([]);
      Alert.alert(
        "Kept safe",
        chosen.length === 1
          ? "Your montage is now in your gallery."
          : `${chosen.length} montages are now in your gallery.`,
      );
    } catch (error) {
      console.error("[gallery] export failed:", error);
      Alert.alert("Couldn't keep it", "Your montages couldn't be saved to your gallery.");
    } finally {
      if (aliveRef.current) setExporting(false);
    }
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
      {/* The selection bar sits on top of the header rather than replacing it, so swapping the two can't shift the grid. */}
      <View>
        <View style={s.header}>
          <Text style={s.headerTitle}>Your montages</Text>
          <Text style={s.headerSubtitle}>
            {montages.length === 0
              ? "The montages you weave will live here"
              : `${montages.length} ${montages.length === 1 ? "montage" : "montages"} from your days`}
          </Text>
        </View>

        {selectionMode && (
          <Animated.View
            style={[StyleSheet.absoluteFill, s.selectionBar]}
            entering={FadeIn.duration(110)}
            exiting={FadeOut.duration(80)}
          >
            <Pressable onPress={() => setSelectedIds([])} hitSlop={10} style={s.selectionClose}>
              <FontAwesomeFreeSolid name="xmark" size={16} color={colors.textPrimary} />
            </Pressable>
            <Text style={s.selectionCount}>{selectedIds.length} selected</Text>
            <View style={s.selectionActions}>
              <Pressable style={s.actionBtn} onPress={handleExportSelected} disabled={exporting}>
                <FontAwesomeFreeSolid name="arrow-up-from-bracket" size={13} color={colors.primary} />
                <Text style={s.actionText}>Export</Text>
              </Pressable>
              <Pressable style={s.actionBtn} onPress={() => setConfirmDelete(true)}>
                <FontAwesomeFreeSolid name="trash" size={13} color={colors.error} />
                <Text style={[s.actionText, s.actionTextDanger]}>Delete</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </View>

      {montages.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIconWrap}>
            <FontAwesomeFreeSolid name="clapperboard" size={26} color={colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No montages yet</Text>
          <Text style={s.emptyText}>
            Gather the days you've kept and weave them into something you can watch back.
          </Text>
          <Pressable style={s.emptyCta} onPress={() => setSheetVisible(true)}>
            <Text style={s.emptyCtaText}>Weave your first montage</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.FlatList
          style={s.list}
          itemLayoutAnimation={LinearTransition.duration(160)}
          data={montages}
          keyExtractor={(m) => String(m.id)}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => (
            <MontageCard
              montage={item}
              width={CARD_WIDTH}
              selectionMode={selectionMode}
              selected={selectedIds.includes(item.id)}
              onPress={handlePress}
              onLongPress={toggleSelected}
            />
          )}
        />
      )}

      {!selectionMode && (
        <View style={s.fab}>
          <Pressable style={s.fabPress} onPress={() => setSheetVisible(true)}>
            <FontAwesomeFreeSolid name="plus" size={22} color={colors.textOnAccent} />
          </Pressable>
        </View>
      )}

      <CompileSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCompile={handleCompile}
      />

      <MediaLightbox selected={selected} onClose={() => setSelected(null)} />

      <DeleteConfirmModal
        visible={confirmDelete}
        title={selectedIds.length === 1 ? "Unravel this montage?" : `Unravel ${selectedIds.length} montages?`}
        body={
          singleSelected
            ? `${montageLabelText(singleSelected.dateRangeStart, singleSelected.dateRangeEnd)} will be gone for good. The days it was woven from stay safe in your entries.`
            : "These montages will be gone for good. The days they were woven from stay safe in your entries."
        }
        onConfirm={handleDeleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />

      {exporting && (
        <View style={s.progressOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.progressText}>Saving to your gallery…</Text>
        </View>
      )}

      {progress && (
        <View style={s.progressOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.progressText}>
            {progress.stage === "converting"
              ? `Gathering day ${progress.current} of ${progress.total}…`
              : "Weaving them together…"}
          </Text>
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
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
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: 56,
    paddingBottom: spacing[3],
    backgroundColor: colors.bg,
  },
  selectionClose: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCount: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  selectionActions: { flexDirection: "row", gap: spacing[2] },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  actionText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.primary,
  },
  actionTextDanger: { color: colors.error },
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
  fabPress: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  fab: {
    position: "absolute",
    bottom: spacing[6],
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
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
}));
