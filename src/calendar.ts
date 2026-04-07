export interface CalendarOptions {
  highlight?: number[];
  firstDayOfWeek?: 0 | 1;
}

const DAYS_SUN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAYS_MON = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function renderCalendar(year: number, month: number, options: CalendarOptions = {}): string {
  const { highlight = [], firstDayOfWeek = 0 } = options;

  const title = `${MONTH_NAMES[month - 1]} ${year}`;
  const days = firstDayOfWeek === 1 ? DAYS_MON : DAYS_SUN;
  const headerWidth = days.join(' ').length;

  const lines: string[] = [];
  lines.push(title.padStart(Math.floor((headerWidth + title.length) / 2)).padEnd(headerWidth));
  lines.push(days.join(' '));

  const firstDate = new Date(year, month - 1, 1);
  let startDay = firstDate.getDay(); // 0=Sun
  if (firstDayOfWeek === 1) {
    startDay = (startDay + 6) % 7; // shift so Mon=0
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const highlightSet = new Set(highlight);

  let week: string[] = [];
  // Fill leading blanks
  for (let i = 0; i < startDay; i++) {
    week.push('  ');
  }

  const annotations: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    if (highlightSet.has(d)) {
      if (d < 10) {
        week.push(`*${d}`);
      } else {
        week.push(String(d));
        annotations.push(`* ${d}`);
      }
    } else {
      week.push(d < 10 ? ` ${d}` : String(d));
    }

    if (week.length === 7) {
      lines.push(week.join(' '));
      week = [];
    }
  }

  if (week.length > 0) {
    lines.push(week.join(' '));
  }

  if (annotations.length > 0) {
    lines.push(annotations.join(' '));
  }

  return lines.join('\n');
}
