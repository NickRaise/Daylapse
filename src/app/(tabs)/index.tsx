import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import FontAwesomeFreeSolid, {
  type FontAwesomeFreeSolidIconName,
} from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { useHomeData } from "@/hooks/useHomeData";
import { useOpenCamera } from "@/hooks/useOpenCamera";
import useEntryStore from "@/store/entry.store";
import { parseDateKey } from "@/components/calendar/utils";
import { MontageCard } from "@/components/montage/MontageCard";
import { MediaThumbnail } from "@/components/media/MediaThumbnail";
import { MediaLightbox } from "@/components/day/MediaLightbox";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

type QuickActionProps = {
  icon: FontAwesomeFreeSolidIconName;
  label: string;
  onPress: () => void;
};

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  const s = useStyles();
  const colors = useColors();
  return (
    <Pressable style={s.quickItem} onPress={onPress}>
      <View style={s.quickIconWrap}>
        <FontAwesomeFreeSolid name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={s.quickLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Home() {
  const s = useStyles();
  const colors = useColors();
  const router = useRouter();
  const openCamera = useOpenCamera();
  const data = useHomeData();
  const [playingMontage, setPlayingMontage] = useState<string | null>(null);

  async function handleQuickCapture() {
    await useEntryStore.getState().createEntry(data.todayKey);
    openCamera(data.todayKey);
  }

  function goToday() {
    router.push({ pathname: "/day", params: { dateKey: data.todayKey } });
  }

  const latestPreview = useMemo(() => {
    if (!data.latestEntry) return null;
    const { dayName, formattedDate } = parseDateKey(data.latestEntry.date);
    return { ...data.latestEntry, dayName, formattedDate };
  }, [data.latestEntry]);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.greeting}>{greeting()}</Text>
        <Text style={s.tagline}>Your days, one frame at a time.</Text>
      </View>

      {!data.loading && (
        <View style={s.statsRow}>
          <View style={s.statPill}>
            <FontAwesomeFreeSolid name="fire" size={13} color={colors.primary} />
            <Text style={s.statText}>{data.streak} day{data.streak === 1 ? "" : "s"} streak</Text>
          </View>
          <View style={s.statPill}>
            <FontAwesomeFreeSolid name="images" size={13} color={colors.primary} />
            <Text style={s.statText}>{data.totalEntries} entries</Text>
          </View>
        </View>
      )}

      <Pressable
        style={s.todayCard}
        onPress={data.hasTodayEntry ? goToday : handleQuickCapture}
      >
        {data.hasTodayEntry ? (
          <>
            <View style={s.todayIconWrap}>
              <FontAwesomeFreeSolid name="check" size={16} color={colors.primary} />
            </View>
            <View style={s.todayTextWrap}>
              <Text style={s.todayTitle}>Today's memory is saved</Text>
              <Text style={s.todaySubtitle}>Tap to view or add more</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[s.todayIconWrap, s.todayIconWrapAccent]}>
              <FontAwesomeFreeSolid name="camera" size={16} color={colors.textOnAccent} />
            </View>
            <View style={s.todayTextWrap}>
              <Text style={s.todayTitle}>Capture today's moment</Text>
              <Text style={s.todaySubtitle}>Nothing added yet today</Text>
            </View>
            <FontAwesomeFreeSolid name="chevron-right" size={14} color={colors.textMuted} />
          </>
        )}
      </Pressable>

      <View style={s.quickRow}>
        <QuickAction icon="camera" label="Capture" onPress={handleQuickCapture} />
        <QuickAction icon="calendar" label="Calendar" onPress={() => router.push("/calendar")} />
        <QuickAction icon="clapperboard" label="Montages" onPress={() => router.push("/gallery")} />
        <QuickAction icon="pen" label="Journal" onPress={goToday} />
      </View>

      {latestPreview && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Latest entry</Text>
          <Pressable
            style={s.latestCard}
            onPress={() => router.push({ pathname: "/day", params: { dateKey: latestPreview.date } })}
          >
            {data.latestThumbnail && (
              <View style={s.latestThumbWrap}>
                <MediaThumbnail uri={data.latestThumbnail.uri} type={data.latestThumbnail.type} />
              </View>
            )}
            <View style={s.latestTextWrap}>
              <Text style={s.latestDate}>{latestPreview.dayName}, {latestPreview.formattedDate}</Text>
              <Text style={s.latestJournal} numberOfLines={3}>
                {latestPreview.journal?.trim() || "No journal entry — just memories."}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {data.recentThumbnails.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Recent days</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.recentRow}
          >
            {data.recentThumbnails.map((item) => (
              <Pressable
                key={item.dateKey}
                style={s.recentThumb}
                onPress={() => router.push({ pathname: "/day", params: { dateKey: item.dateKey } })}
              >
                <MediaThumbnail uri={item.uri} type={item.type} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {data.montages.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your montages</Text>
          <View style={s.montageRow}>
            {data.montages.map((m) => (
              <MontageCard
                key={m.id}
                montage={m}
                width={108}
                onPress={(montage) => setPlayingMontage(montage.outputUri)}
              />
            ))}
          </View>
        </View>
      )}

      {data.loading && <ActivityIndicator style={s.loading} color={colors.primary} />}

      <MediaLightbox
        selected={playingMontage ? { uri: playingMontage, type: "video" } : null}
        onClose={() => setPlayingMontage(null)}
      />
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: 56,
    paddingBottom: spacing[10],
    gap: spacing[6],
  },
  loading: { marginTop: spacing[6] },

  header: { gap: 2 },
  greeting: {
    fontFamily: "Caveat",
    fontSize: 34,
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  statsRow: { flexDirection: "row", gap: spacing[2] },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 7,
  },
  statText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  todayIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  todayIconWrapAccent: { backgroundColor: colors.primary },
  todayTextWrap: { flex: 1, gap: 2 },
  todayTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  todaySubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  quickRow: { flexDirection: "row" },
  quickItem: { flex: 1, alignItems: "center", gap: 6 },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  section: { gap: spacing[3] },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  latestCard: {
    flexDirection: "row",
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  latestThumbWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.bgSubtle,
  },
  latestTextWrap: { flex: 1, gap: 6 },
  latestDate: {
    fontSize: fontSize.xs,
    fontWeight: "700",
    color: colors.primary,
  },
  latestJournal: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  recentRow: { gap: spacing[3] },
  recentThumb: {
    width: 108,
    height: 144,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },

  montageRow: { flexDirection: "row", gap: spacing[3] },
}));
