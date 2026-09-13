import { MONTH_NAMES } from "@/components/calendar/utils";

export type MontageLabel = { primary: string; secondary?: string };

type DateParts = { year: number; month: number; day: number };

function parseKey(key: string): DateParts {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

function lastDayOf(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function shortMonth(month: number): string {
  return MONTH_NAMES[month].slice(0, 3);
}

// A montage is named after the span it covers: a whole year or month gets its plain name,
// anything else falls back to the shortest range wording that still reads on a small card.
export function montageLabel(startKey: string, endKey: string): MontageLabel {
  const start = parseKey(startKey);
  const end = parseKey(endKey);
  const sameYear = start.year === end.year;
  const sameMonth = sameYear && start.month === end.month;

  if (sameYear && start.month === 0 && start.day === 1 && end.month === 11 && end.day === 31) {
    return { primary: String(start.year) };
  }

  if (sameMonth && start.day === 1 && end.day === lastDayOf(end.year, end.month)) {
    return { primary: MONTH_NAMES[start.month], secondary: String(start.year) };
  }

  const year = String(start.year);

  if (startKey === endKey) {
    return { primary: `${start.day} ${shortMonth(start.month)}`, secondary: year };
  }
  if (sameMonth) {
    return { primary: `${start.day} – ${end.day} ${shortMonth(start.month)}`, secondary: year };
  }
  if (sameYear) {
    return {
      primary: `${start.day} ${shortMonth(start.month)} – ${end.day} ${shortMonth(end.month)}`,
      secondary: year,
    };
  }
  // Day precision is dropped across years so the range still fits one line.
  return {
    primary: `${shortMonth(start.month)} ${start.year}`,
    secondary: `– ${shortMonth(end.month)} ${end.year}`,
  };
}

export function montageLabelText(startKey: string, endKey: string): string {
  const { primary, secondary } = montageLabel(startKey, endKey);
  return secondary ? `${primary} ${secondary}` : primary;
}
