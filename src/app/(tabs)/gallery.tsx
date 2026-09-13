import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { colors, fontSize, radius, spacing } from "@/theme";
import { MontageRepository } from "@/repositories/montage.repository";
import type { Montage } from "@/db/schema";
import { MontageCard } from "@/components/montage/MontageCard";
import { CompileSheet, type CompileRange } from "@/components/montage/CompileSheet";
import { MediaLightbox } from "@/components/day/MediaLightbox";
import { compileMontage, type CompileProgress } from "@/service/montage.service";

type Selected = { uri: string; type: "image" | "video" } | null;

export default function Gallery() {
  const [montages, setMontages] = useState<Montage[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selected, setSelected] = useState<Selected>(null);
  const [progress, setProgress] = useState<CompileProgress | null>(null);

  const refresh = useCallback(() => {
    MontageRepository.getAllMontages().then(setMontages);
  }, []);

  useFocusEffect(refresh);

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
      {montages.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No montages yet — compile one from your daily media.</Text>
        </View>
      ) : (
        <FlatList
          data={montages}
          keyExtractor={(m) => String(m.id)}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => (
            <MontageCard
              montage={item}
              onPress={(m) => setSelected({ uri: m.outputUri, type: "video" })}
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[6],
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  grid: {
    padding: spacing[4],
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
