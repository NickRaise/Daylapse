import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { EntryRepository } from "@/repositories/entry.repository";
import { MediaRepository, type MediaThumbnailRef } from "@/repositories/media.repository";
import { MontageRepository } from "@/repositories/montage.repository";
import { todayDateKey } from "@/utils/date";
import { formatDateKey } from "@/components/calendar/utils";
import { computeStreakStats } from "@/utils/streak";
import type { Entry, Montage } from "@/db/schema";

const HISTORY_DAYS = 730; // ~2 years — wide enough for a meaningful streak/entry count
const RECENT_DAYS = 10;

export type RecentThumbnail = { dateKey: string } & MediaThumbnailRef;

export type HomeData = {
  loading: boolean;
  todayKey: string;
  hasTodayEntry: boolean;
  streak: number;
  totalEntries: number;
  latestEntry: Entry | null;
  latestThumbnail: MediaThumbnailRef | null;
  recentThumbnails: RecentThumbnail[];
  montages: Montage[];
};

const EMPTY_DATA: HomeData = {
  loading: true,
  todayKey: todayDateKey(),
  hasTodayEntry: false,
  streak: 0,
  totalEntries: 0,
  latestEntry: null,
  latestThumbnail: null,
  recentThumbnails: [],
  montages: [],
};

function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// Powers the Home tab: streak/entry stats, today's status, a latest-entry preview, a recent-days strip, and a montages teaser.
export function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>(EMPTY_DATA);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    const todayKey = todayDateKey();
    const historyStart = dateKeyDaysAgo(HISTORY_DAYS);
    const recentStart = dateKeyDaysAgo(RECENT_DAYS);

    const [entries, thumbnails, montages] = await Promise.all([
      EntryRepository.getEntriesByDateRange(historyStart, todayKey),
      MediaRepository.getFirstMediaByDateRange(historyStart, todayKey),
      MontageRepository.getAllMontages(),
    ]);

    const rows = entries ?? [];
    const { streak, hasTodayEntry } = computeStreakStats(rows, todayKey);

    // Query has no guaranteed order, so pick the max by date string (YYYY-MM-DD sorts correctly) rather than trusting row order.
    const withJournal = rows.filter((e) => !!e.journal?.trim());
    const pool = withJournal.length > 0 ? withJournal : rows;
    const latestEntry = pool.length > 0 ? pool.reduce((a, b) => (a.date > b.date ? a : b)) : null;

    const recentThumbnails = Object.entries(thumbnails)
      .filter(([dateKey]) => dateKey >= recentStart)
      .map(([dateKey, ref]) => ({ dateKey, ...ref }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

    const latestThumbnail = latestEntry ? (thumbnails[latestEntry.date] ?? null) : null;

    if (!aliveRef.current) return;
    setData({
      loading: false,
      todayKey,
      hasTodayEntry,
      streak,
      totalEntries: rows.length,
      latestEntry,
      latestThumbnail,
      recentThumbnails,
      montages: montages.slice(0, 3),
    });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => () => {
    aliveRef.current = false;
  }, []);

  return data;
}
