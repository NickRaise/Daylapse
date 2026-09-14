import { formatDateKey } from "@/components/calendar/utils";
import type { Entry } from "@/db/schema";

export type StreakStats = {
  streak: number;
  hasTodayEntry: boolean;
  daysSinceLastEntry: number | null;
};

// Shared by the Home stats and the reminder notification, so both agree on what counts as "kept".
export function computeStreakStats(rows: Entry[], todayKey: string): StreakStats {
  const byDate = new Set(rows.map((e) => e.date));

  // A day only counts toward the streak if it was actually logged the day it happened —
  // backfilling ten old days in one sitting shouldn't read as ten days of regular use.
  const loggedOnTime = new Set(
    rows
      .filter((e) => formatDateKey(e.createdAt.getFullYear(), e.createdAt.getMonth(), e.createdAt.getDate()) === e.date)
      .map((e) => e.date),
  );

  // Streak counts consecutive days ending today, or yesterday if today isn't logged yet (so it doesn't reset before the day is even over).
  let streak = 0;
  const cursor = new Date();
  if (!loggedOnTime.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const key = formatDateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (!loggedOnTime.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const dates = rows.map((e) => e.date).sort();
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;
  const daysSinceLastEntry = lastDate
    ? Math.round((Date.parse(`${todayKey}T00:00:00`) - Date.parse(`${lastDate}T00:00:00`)) / 86_400_000)
    : null;

  return { streak, hasTodayEntry: byDate.has(todayKey), daysSinceLastEntry };
}
