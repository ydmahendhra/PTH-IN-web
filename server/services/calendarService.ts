export interface ReportingWeek {
  weekNumber: number;
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  month: string;
  year: number;
}

export interface ReportingMonth {
  name: string;
  monthIndex: number; // 1 - 12
  year: number;
  weeksCount: number;
  weeks: ReportingWeek[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getMonthWeeks(year: number, monthIndex: number): ReportingWeek[] {
  // monthIndex: 1 to 12
  const monthName = MONTH_NAMES[monthIndex - 1];
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const weeks: ReportingWeek[] = [];

  let currentDay = 1;
  let weekNum = 1;

  while (currentDay <= daysInMonth) {
    const startDay = currentDay;
    const endDay = Math.min(currentDay + 6, daysInMonth);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const startStr = `${year}-${pad(monthIndex)}-${pad(startDay)}`;
    const endStr = `${year}-${pad(monthIndex)}-${pad(endDay)}`;

    weeks.push({
      weekNumber: weekNum,
      label: `Week ${weekNum}: ${monthName} ${startDay} – ${monthName} ${endDay}`,
      startDate: startStr,
      endDate: endStr,
      month: monthName,
      year,
    });

    currentDay = endDay + 1;
    weekNum++;
  }

  return weeks;
}

export function getReportingCalendar(targetYear?: number): ReportingMonth[] {
  const year = targetYear || new Date().getFullYear();
  const calendar: ReportingMonth[] = [];

  for (let m = 1; m <= 12; m++) {
    const weeks = getMonthWeeks(year, m);
    calendar.push({
      name: MONTH_NAMES[m - 1],
      monthIndex: m,
      year,
      weeksCount: weeks.length,
      weeks,
    });
  }

  return calendar;
}
