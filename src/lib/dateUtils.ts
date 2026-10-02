import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  isYesterday, 
  isPast, 
  startOfDay, 
  addDays, 
  subDays,
  isValid,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay
} from 'date-fns';

export const DEFAULT_TIMEZONE = 'Asia/Amman';

/**
 * Returns formatted YYYY-MM-DD string for today in specified or local timezone
 */
export function getTodayDateString(): string {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}

/**
 * Safely parse a date-only YYYY-MM-DD string as a local calendar date
 * without UTC shift jumping days.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Format is YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const date = new Date(year, month, day, 12, 0, 0); // midday avoids DST shift
  return isValid(date) ? date : null;
}

/**
 * Format a YYYY-MM-DD date into friendly relative text:
 * Today, Tomorrow, Yesterday, Monday, Oct 12, etc.
 */
export function formatFriendlyDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'No due date';
  const date = parseLocalDate(dateStr);
  if (!date) return dateStr;

  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';

  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 1 && diffDays < 7) {
    return format(date, 'EEEE'); // e.g. Wednesday
  }

  if (date.getFullYear() === now.getFullYear()) {
    return format(date, 'MMM d'); // e.g. Oct 12
  }

  return format(date, 'MMM d, yyyy');
}

/**
 * Check if a YYYY-MM-DD string is overdue (prior to today)
 */
export function isDateOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const todayStr = getTodayDateString();
  return dateStr < todayStr;
}

/**
 * Dynamic greeting based on current local hour:
 * 5:00 - 11:59 => Good morning
 * 12:00 - 16:59 => Good afternoon
 * 17:00 - 4:59 => Good evening
 */
export function getDynamicGreeting(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const now = new Date();
    // Use Intl.DateTimeFormat to get hour in target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const hourStr = formatter.format(now);
    const hour = parseInt(hourStr, 10);

    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  } catch {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}

/**
 * Format full current date (e.g. "Friday, October 2, 2026")
 */
export function getFullCurrentDate(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  } catch {
    return format(new Date(), 'EEEE, MMMM d, yyyy');
  }
}

/**
 * Format time according to user 12h or 24h format
 */
export function formatTimeDisplay(timeStr: string | null | undefined, formatPreference: '12h' | '24h' = '12h'): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');

  if (formatPreference === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}

export { 
  format, 
  isToday, 
  isTomorrow, 
  isYesterday, 
  isPast, 
  startOfDay, 
  addDays, 
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay 
};
