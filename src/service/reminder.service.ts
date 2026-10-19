import * as Notifications from "expo-notifications";
import { EntryRepository } from "@/repositories/entry.repository";
import { MediaRepository } from "@/repositories/media.repository";
import { computeStreakStats } from "@/utils/streak";
import { todayDateKey } from "@/utils/date";
import { formatDateKey } from "@/components/calendar/utils";
import { pickReminderMessage } from "@/service/reminderMessages";
import useSettingsStore from "@/store/settings.store";

const LEGACY_REMINDER_ID = "daylapse-daily-reminder";
const REMINDER_PREFIX = "daylapse-reminder-";
const DAYS_AHEAD = 7;
const HISTORY_DAYS = 400;

const REMINDER_IDS = [
  LEGACY_REMINDER_ID,
  ...Array.from({ length: DAYS_AHEAD }, (_, i) => `${REMINDER_PREFIX}${i}`),
];

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((Date.parse(`${toKey}T00:00:00`) - Date.parse(`${fromKey}T00:00:00`)) / 86_400_000);
}

let handlerConfigured = false;

// Shows the notification banner even while the app is open, matching how a real "come back" nudge behaves.
export function configureNotificationHandler() {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

function dateKeyDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// The next moment hour:minute occurs — today if it hasn't passed yet, tomorrow otherwise.
function nextOccurrence(hour: number, minute: number): Date {
  const next = new Date();
  next.setSeconds(0, 0);
  next.setHours(hour, minute);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next;
}

// Schedules a week of reminders ahead so they keep coming even if the app isn't opened; resynced on every foreground/background.
export async function syncReminder(): Promise<void> {
  await cancelReminder();

  const { reminderEnabled, reminderHour, reminderMinute } = useSettingsStore.getState();
  if (!reminderEnabled) return;

  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return;

  const todayKey = todayDateKey();
  const historyStart = dateKeyDaysAgo(HISTORY_DAYS);
  const [rows, thumbnails] = await Promise.all([
    EntryRepository.getEntriesByDateRange(historyStart, todayKey),
    MediaRepository.getFirstMediaByDateRange(historyStart, todayKey),
  ]);
  const stats = computeStreakStats(rows ?? [], todayKey, new Set(Object.keys(thumbnails)));
  const lastKept = stats.keptDates.length > 0 ? stats.keptDates[stats.keptDates.length - 1] : null;
  const first = nextOccurrence(reminderHour, reminderMinute);

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const fireDate = new Date(first);
    fireDate.setDate(first.getDate() + i);
    const fireKey = formatDateKey(fireDate.getFullYear(), fireDate.getMonth(), fireDate.getDate());
    if (fireKey === todayKey && stats.hasTodayEntry) continue;

    // Copy for each day assumes nothing new gets logged before it fires; the next resync corrects it if something is.
    const daysSinceLastEntry = lastKept ? daysBetween(lastKept, fireKey) : null;
    const message = pickReminderMessage({
      streak: daysSinceLastEntry === 1 ? stats.streak : 0,
      daysSinceLastEntry,
      isEvening: reminderHour >= 18,
    });

    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_PREFIX}${i}`,
      content: { title: message.title, body: message.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  }
}

export async function cancelReminder(): Promise<void> {
  await Promise.all(
    REMINDER_IDS.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})),
  );
}
