import React, { useRef, useMemo, useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  FlatList,
  View,
  StyleSheet,
  Platform,
  StatusBar,
  LayoutChangeEvent,
} from "react-native";
import MonthView from "../components/calendar/MonthView";
import {
  NUM_COLUMNS,
  CELL_SIZE,
  CELL_GAP,
  MONTH_HEADER_HEIGHT,
  computeMonthHeight,
} from "../components/calendar/layout";
import {
  generateMonths,
  getTodayKey,
  getTodayTimestamp,
  type MonthData,
} from "../components/calendar/utils";

const RANGE = 200; // ±200 months from today

export default function CalendarScreen() {
  const today = useMemo(() => getTodayKey(), []);
  const todayTimestamp = useMemo(() => getTodayTimestamp(), []);
  const months = useMemo(() => generateMonths(new Date(), RANGE), []);

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

  const scrollToToday = useCallback(() => {
    const containerH = containerHeightRef.current;
    if (!containerH || !offsets.length) return;

    const todayDay = new Date().getDate();
    const todayRowIndex = Math.floor((todayDay - 1) / NUM_COLUMNS);
    const rowH = CELL_SIZE + CELL_GAP;

    // Absolute Y of today's row top inside the full list
    const todayRowY = offsets[RANGE] + MONTH_HEADER_HEIGHT + todayRowIndex * rowH;

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

  // Jump back to today on every tab focus.
  useFocusEffect(
    useCallback(() => {
      scrollToToday();
    }, [scrollToToday]),
  );

  const [entries] = useState<Record<string, boolean>>({});

  const handleDayPress = useCallback((dateKey: string) => {
    console.log("[calendar] day pressed:", dateKey);
  }, []);

  const handleDayLongPress = useCallback((dateKey: string) => {
    console.log("[calendar] long press:", dateKey);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MonthData }) => (
      <MonthView
        month={item}
        today={today}
        todayTimestamp={todayTimestamp}
        entries={entries}
        onDayPress={handleDayPress}
        onDayLongPress={handleDayLongPress}
      />
    ),
    [today, todayTimestamp, entries, handleDayPress, handleDayLongPress],
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <FlatList
        ref={listRef}
        data={months}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        initialScrollIndex={RANGE}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={3}
        initialNumToRender={3}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={Platform.OS === "android"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
