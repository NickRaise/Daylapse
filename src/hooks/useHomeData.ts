import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { EntryRepository } from "@/repositories/entry.repository";
import { MediaRepository } from "@/repositories/media.repository";
import { MontageRepository } from "@/repositories/montage.repository";
import { todayDateKey } from "@/utils/date";
import { formatDateKey } from "@/components/calendar/utils";
import type { Entry, Montage } from "@/db/schema";

const HISTORY_DAYS = 730; // ~2 years — wide enough for a meaningful streak/entry count
const RECENT_DAYS = 10;

export type RecentThumbnail = { dateKey: string; uri: string };

export type HomeData = {
  loading: boolean;
  todayKey: string;
  hasTodayEntry: boolean;
  streak: number;
  totalEntries: number;
  latestEntry: Entry | null;
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

  const refresh = useCallback(async () => {
    const todayKey = todayDateKey();
    const historyStart = dateKeyDaysAgo(HISTORY_DAYS);
    const recentStart = dateKeyDaysAgo(RECENT_DAYS);

    const [entries, thumbnails, montages] = await Promise.all([
      EntryRepository.getEntriesByDateRange(historyStart, todayKey),
      MediaRepository.getFirstMediaByDateRange(recentStart, todayKey),
      MontageRepository.getAllMontages(),
    ]);

    const rows = entries ?? [];
    const byDate = new Set(rows.map((e) => e.date));

    // Streak counts consecutive days ending today, or yesterday if today isn't logged yet (so it doesn't reset before the day is even over).
    let streak = 0;
    const cursor = new Date();
    if (!byDate.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const key = formatDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      if (!byDate.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Query has no guaranteed order, so pick the max by date string (YYYY-MM-DD sorts correctly) rather than trusting row order.
    const withJournal = rows.filter((e) => !!e.journal?.trim());
    const pool = withJournal.length > 0 ? withJournal : rows;
    const latestEntry = pool.length > 0 ? pool.reduce((a, b) => (a.date > b.date ? a : b)) : null;

    const recentThumbnails = Object.entries(thumbnails)
      .map(([dateKey, uri]) => ({ dateKey, uri }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

    setData({
      loading: false,
      todayKey,
      hasTodayEntry: byDate.has(todayKey),
      streak,
      totalEntries: rows.length,
      latestEntry,
      recentThumbnails,
      montages: montages.slice(0, 3),
    });
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  return data;
}
