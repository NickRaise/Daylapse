import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  View,
  StyleSheet,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import MonthView from "../../../components/calendar/MonthView";
import { SlideshowPlayer } from "../../../components/calendar/SlideshowPlayer";
import {
  NUM_COLUMNS,
  CELL_SIZE,
  CELL_GAP,
  MONTH_HEADER_HEIGHT,
  computeMonthHeight,
} from "../../../components/calendar/layout";
import { colors } from "../../../theme";
import {
  generateMonths,
  getTodayKey,
  getTodayTimestamp,
  formatDateKey,
  type MonthData,
} from "../../../components/calendar/utils";
import FloatingActions from "@/components/calendar/FloatingAction";
import useEntryStore from "@/store/entry.store";
import { MediaRepository, type MediaThumbnailRef, type SlideshowMedia } from "@/repositories/media.repository";

const PAST_MONTHS = 60; // ~5 years back
const FUTURE_MONTHS = 3; // 3 months ahead

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarScreen() {
  const today = useMemo(() => getTodayKey(), []);
  const todayTimestamp = useMemo(() => getTodayTimestamp(), []);
  const months = useMemo(
    () => generateMonths(new Date(), PAST_MONTHS, FUTURE_MONTHS),
    [],
  );
  const router = useRouter();

  const entriesCache = useEntryStore((s) => s.entriesCache);
  const loadEntriesCache = useEntryStore((s) => s.loadEntriesCache);

  const [thumbnails, setThumbnails] = useState<Record<string, MediaThumbnailRef>>({});

  // Compute the date range for the full visible calendar span once
  const { startDate, endDate } = useMemo(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - PAST_MONTHS);
    start.setDate(1);

    const end = new Date();
    end.setMonth(end.getMonth() + FUTURE_MONTHS + 1);
    end.setDate(0); // last day of the FUTURE_MONTHS'th month ahead

    return { startDate: toDateKey(start), endDate: toDateKey(end) };
  }, []);

  // One batched DB read on mount — populates hasEntry dots for all visible cells
  useEffect(() => {
    loadEntriesCache(startDate, endDate);
  }, []);

  // Derive boolean map for MonthView — only recomputes when cache changes
  const entries = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const k of Object.keys(entriesCache)) map[k] = true;
    return map;
  }, [entriesCache]);

  const { heights, offsets } = useMemo(() => {
    const h = months.map((m) =>
      computeMonthHeight(Math.ceil(m.daysInMonth / NUM_COLUMNS)),
    );
    const o = [0];
    for (let i = 0; i < h.length - 1; i++) o.push(o[i] + h[i]);
    return { heights: h, offsets: o };
  }, [months]);

  const listRef = useRef<FlatList<MonthData>>(null);
  const containerHeightRef = useRef(0);
  // Updated on every scroll (no re-render needed — only read when Play is tapped).
  const visibleMonthIndexRef = useRef(PAST_MONTHS);
  const [slideshowMedia, setSlideshowMedia] = useState<SlideshowMedia[] | null>(null);

  const scrollToToday = useCallback(() => {
    const containerH = containerHeightRef.current;
    if (!containerH || !offsets.length) return;

    const todayDay = new Date().getDate();
    const todayRowIndex = Math.floor((todayDay - 1) / NUM_COLUMNS);
    const rowH = CELL_SIZE + CELL_GAP;

    // Absolute Y of today's row top inside the full list
    const todayRowY =
      offsets[PAST_MONTHS] + MONTH_HEADER_HEIGHT + todayRowIndex * rowH;

    // Position today such that 2 full rows remain visible below it
    const targetOffset = Math.max(0, todayRowY - containerH + 3 * rowH);

    listRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
  }, [offsets]);

  // Capture the real container height so the scroll math is exact,
  // and fire the initial scroll as soon as the layout is known.
  const onContainerLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      if (h !== containerHeightRef.current) {
        containerHeightRef.current = h;
        scrollToToday();
      }
    },
    [scrollToToday],
  );

  // Jump back to today and refresh thumbnails on every tab focus.
  useFocusEffect(
    useCallback(() => {
      scrollToToday();
      MediaRepository.getFirstMediaByDateRange(startDate, endDate).then(setThumbnails);
    }, [scrollToToday, startDate, endDate]),
  );

  const handleDayPress = useCallback(
    (dateKey: string) => {
      if (dateKey <= getTodayKey()) {
        router.push({ pathname: "/day", params: { dateKey } });
      }
    },
    [router],
  );

  // Binary-searches the precomputed offsets to find whichever month is at the top of the viewport right now.
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      let lo = 0;
      let hi = offsets.length - 1;
      let idx = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (offsets[mid] <= y) {
          idx = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      visibleMonthIndexRef.current = idx;
    },
    [offsets],
  );

  const handlePlayPress = useCallback(async () => {
    const month = months[visibleMonthIndexRef.current];
    if (!month) return;
    const start = formatDateKey(month.year, month.month, 1);
    const end = formatDateKey(month.year, month.month, month.daysInMonth);
    const items = await MediaRepository.getMediaByDateRange(start, end);
    if (items.length > 0) setSlideshowMedia(items);
  }, [months]);

  const renderItem = useCallback(
    ({ item }: { item: MonthData }) => (
      <MonthView
        month={item}
        today={today}
        todayTimestamp={todayTimestamp}
        entries={entries}
        thumbnails={thumbnails}
        onDayPress={handleDayPress}
      />
    ),
    [today, todayTimestamp, entries, thumbnails, handleDayPress],
  );

  const keyExtractor = useCallback((item: MonthData) => item.key, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<MonthData> | null | undefined, index: number) => ({
      length: heights[index],
      offset: offsets[index],
      index,
    }),
    [heights, offsets],
  );

  return (
    <View style={styles.root} onLayout={onContainerLayout}>
      <FlatList
        ref={listRef}
        data={months}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialScrollIndex={PAST_MONTHS}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        windowSize={5}
        maxToRenderPerBatch={5}
        initialNumToRender={5}
        updateCellsBatchingPeriod={100}
        removeClippedSubviews={true}
      />

      {/* Floating action icon - Play & Add */}
      <FloatingActions onPlayPress={handlePlayPress} />

      <SlideshowPlayer media={slideshowMedia} onClose={() => setSlideshowMedia(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
