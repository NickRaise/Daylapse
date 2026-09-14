import * as Notifications from "expo-notifications";
import { EntryRepository } from "@/repositories/entry.repository";
import { computeStreakStats } from "@/utils/streak";
import { todayDateKey } from "@/utils/date";
import { formatDateKey } from "@/components/calendar/utils";
import { pickReminderMessage } from "@/service/reminderMessages";
import useSettingsStore from "@/store/settings.store";

const REMINDER_ID = "daylapse-daily-reminder";
const HISTORY_DAYS = 400;

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

// Recomputes and reschedules the one pending reminder from the current streak state. The message depends on
// state that changes daily (streak, days away), so rather than one repeating trigger with stale copy, this is
// called fresh on every app foreground/background and right after an entry is added for today.
export async function syncReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});

  const { reminderEnabled, reminderHour, reminderMinute } = useSettingsStore.getState();
  if (!reminderEnabled) return;

  const perms = await Notifications.getPermissionsAsync();
  if (!perms.granted) return;

  const todayKey = todayDateKey();
  const rows = (await EntryRepository.getEntriesByDateRange(dateKeyDaysAgo(HISTORY_DAYS), todayKey)) ?? [];
  const stats = computeStreakStats(rows, todayKey);
  if (stats.hasTodayEntry) return;

  const fireDate = nextOccurrence(reminderHour, reminderMinute);
  const message = pickReminderMessage({
    streak: stats.streak,
    daysSinceLastEntry: stats.daysSinceLastEntry,
    isEvening: reminderHour >= 18,
  });

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: message.title, body: message.body, sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
}
