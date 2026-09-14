export type ReminderContext = {
  streak: number;
  daysSinceLastEntry: number | null;
  isEvening: boolean;
};

type Message = { title: string; body: string };

function pick(pool: Message[]): Message {
  return pool[Math.floor(Math.random() * pool.length)];
}

// Never kept a single day yet — an invitation, not a demand.
const FIRST_TIME: Message[] = [
  { title: "Today is still blank", body: "One photo, one line — that's all a day needs to be kept." },
  { title: "A day is waiting to be kept", body: "You haven't started your first one yet. It only takes a moment." },
  { title: "Somewhere to begin", body: "Nothing's saved yet. Today would make a fine place to start." },
];

// A streak is alive and there's still time left in the day — protect it, don't scold.
const STREAK_AT_RISK = (n: number): Message[] => [
  { title: `${n} day${n === 1 ? "" : "s"}, and counting?`, body: `Your streak is ${n} day${n === 1 ? "" : "s"} deep. Don't let today be the one that breaks it.` },
  { title: "Still time today", body: `${n} day${n === 1 ? "" : "s"} kept in a row. Today's still open — keep it going.` },
  { title: `Don't let go of ${n} day${n === 1 ? "" : "s"}`, body: "A minute today keeps the whole run alive." },
];

// Same streak, but the reminder fires late — the loss feels closer, so the message leans harder into it.
const STREAK_URGENT = (n: number): Message[] => [
  { title: "Your streak is hanging by a thread", body: `${n} day${n === 1 ? "" : "s"} kept, and today's about to slip away. One line, before it's gone.` },
  { title: `${n} day${n === 1 ? "" : "s"} — almost lost`, body: "There's still a sliver of today left. Don't let the streak go quiet tonight." },
  { title: "Last call for today", body: `${n} day${n === 1 ? "" : "s"} in a row is a lot to let go of over one missed evening.` },
];

// No streak left to protect, but it only just slipped — an easy, guilt-free way back in.
const RECENT_LAPSE = (days: number): Message[] => [
  { title: "Pick up where you left off", body: `It's been ${days} day${days === 1 ? "" : "s"}. Today's a fine place to keep going again.` },
  { title: "A day or two, no more", body: "Nothing's lost yet — just add today, and the days will start lining up again." },
  { title: "Still close by", body: `${days} day${days === 1 ? "" : "s"} since your last one. Come finish what you started.` },
];

// It's been a real while — warmer and softer on purpose, so the absence itself doesn't become the reason to stay away.
const LONG_ABSENCE = (days: number): Message[] => [
  { title: "Your days are quietly slipping away", body: `It's been ${days} days. The ones before it are still safe — but they're waiting on more company.` },
  { title: "We're still keeping your days safe", body: "It's been a while. Whenever you're ready, today is exactly where you left off." },
  { title: "Don't let them go quiet", body: `${days} days have passed without a word. Come add one more before the thread runs too thin.` },
];

// Picks a message tailored to where the user actually stands — a live streak, a fresh lapse, or a long absence —
// each drawn from a small rotating pool so the same reminder never reads the same way twice.
export function pickReminderMessage(ctx: ReminderContext): Message {
  if (ctx.daysSinceLastEntry === null) return pick(FIRST_TIME);
  if (ctx.streak >= 1) return pick(ctx.isEvening ? STREAK_URGENT(ctx.streak) : STREAK_AT_RISK(ctx.streak));
  if (ctx.daysSinceLastEntry <= 3) return pick(RECENT_LAPSE(ctx.daysSinceLastEntry));
  return pick(LONG_ABSENCE(ctx.daysSinceLastEntry));
}
