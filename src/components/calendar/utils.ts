export type MonthData = {
  year: number;
  month: number; // 0-indexed
  key: string;
  daysInMonth: number;
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_ABBRS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function generateMonths(
  centerDate: Date,
  pastMonths: number,
  futureMonths: number,
): MonthData[] {
  const result: MonthData[] = [];
  const baseYear = centerDate.getFullYear();
  const baseMonth = centerDate.getMonth();

  for (let offset = -pastMonths; offset <= futureMonths; offset++) {
    const totalMonths = baseMonth + offset;
    const year = baseYear + Math.floor(totalMonths / 12);
    const month = ((totalMonths % 12) + 12) % 12;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    result.push({ year, month, key: `${year}-${month}`, daysInMonth });
  }

  return result;
}

// Sequential rows: day 1,2,3 / 4,5,6 / … — no weekday-alignment padding
export function buildDayRows(
  daysInMonth: number,
  numColumns: number,
): number[][] {
  const rows: number[][] = [];
  let day = 1;
  while (day <= daysInMonth) {
    const row: number[] = [];
    for (let col = 0; col < numColumns && day <= daysInMonth; col++) {
      row.push(day++);
    }
    rows.push(row);
  }
  return rows;
}

export function getWeekdayAbbr(
  year: number,
  month: number,
  day: number,
): string {
  return WEEKDAY_ABBRS[new Date(year, month, day).getDay()];
}

export function formatDateKey(
  year: number,
  month: number,
  day: number,
): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getTodayKey(): string {
  const d = new Date();
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getTodayTimestamp(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function parseDateKey(dateKey: string): {
  dayName: string;
  month: string;
  year: string;
  formattedDate: string;
} {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");

  const date = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10),
  );
  return {
    dayName: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
    month: new Intl.DateTimeFormat("en-US", { month: "long" }).format(date),
    year: new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date),
    formattedDate: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date),
  };
}
