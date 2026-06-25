import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

export class DateUtil {
  static getUserTimezoneDate(date: Date, timezone: string): Date {
    return toZonedTime(date, timezone);
  }

  static startOfDayInTimezone(date: Date, timezone: string): Date {
    const dateKey = this.formatDateForUser(date, timezone);
    return fromZonedTime(`${dateKey}T00:00:00.000`, timezone);
  }

  static endOfDayInTimezone(date: Date, timezone: string): Date {
    const dateKey = this.formatDateForUser(date, timezone);
    return fromZonedTime(`${dateKey}T23:59:59.999`, timezone);
  }

  static startOfWeekInTimezone(date: Date, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    const weekStart = startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday
    return fromZonedTime(`${format(weekStart, 'yyyy-MM-dd')}T00:00:00.000`, timezone);
  }

  static endOfWeekInTimezone(date: Date, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    const weekEnd = endOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday
    return fromZonedTime(`${format(weekEnd, 'yyyy-MM-dd')}T23:59:59.999`, timezone);
  }

  static startOfMonthInTimezone(date: Date, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    return fromZonedTime(`${format(startOfMonth(zonedDate), 'yyyy-MM-dd')}T00:00:00.000`, timezone);
  }

  static endOfMonthInTimezone(date: Date, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    return fromZonedTime(`${format(endOfMonth(zonedDate), 'yyyy-MM-dd')}T23:59:59.999`, timezone);
  }

  static addDaysInTimezone(date: Date, days: number, timezone: string): Date {
    const zonedDate = toZonedTime(date, timezone);
    return fromZonedTime(`${format(addDays(zonedDate, days), 'yyyy-MM-dd')}T00:00:00.000`, timezone);
  }

  static getDaysBetween(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate) + 1;
  }

  static isToday(date: Date, timezone: string): boolean {
    return this.isSameDayInTimezone(new Date(), date, timezone);
  }

  static isSameDayInTimezone(a: Date, b: Date, timezone: string): boolean {
    return this.formatDateForUser(a, timezone) === this.formatDateForUser(b, timezone);
  }

  static formatDateForUser(date: Date, timezone: string): string {
    return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
  }

  static parseUserDate(date: Date | string | undefined, timezone: string): Date {
    if (!date) {
      return new Date();
    }

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fromZonedTime(`${date}T12:00:00.000`, timezone);
    }

    return new Date(date);
  }

  static getStreakDates(completedDates: Date[], timezone: string): {
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{ startDate: Date; endDate: Date; days: number }>;
  } {
    if (completedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, streakHistory: [] };
    }

    // Sort dates in ascending order
    const sortedDates = completedDates
      .map((date) => this.getUserTimezoneDate(date, timezone))
      .sort((a, b) => a.getTime() - b.getTime());

    const streakHistory: Array<{ startDate: Date; endDate: Date; days: number }> = [];
    let currentStreak = 1;
    let longestStreak = 1;
    let streakStart = sortedDates[0];
    let streakEnd = sortedDates[0];
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currDate = sortedDates[i];
      const dayDiff = differenceInDays(currDate, prevDate);

      if (dayDiff === 1) {
        // Consecutive day
        tempStreak++;
        streakEnd = currDate;

        // Check if this is the current streak
        if (this.isToday(currDate, timezone) || differenceInDays(new Date(), currDate) === 1) {
          currentStreak = tempStreak;
        }
      } else {
        // Streak broken
        streakHistory.push({
          startDate: streakStart,
          endDate: streakEnd,
          days: tempStreak,
        });

        longestStreak = Math.max(longestStreak, tempStreak);

        // Start new streak
        tempStreak = 1;
        streakStart = currDate;
        streakEnd = currDate;
      }
    }

    // Add the last streak
    streakHistory.push({
      startDate: streakStart,
      endDate: streakEnd,
      days: tempStreak,
    });

    longestStreak = Math.max(longestStreak, tempStreak);

    // Update current streak if the last completed date is today or yesterday
    const lastDate = sortedDates[sortedDates.length - 1];
    const daysSinceLastCompletion = differenceInDays(new Date(), lastDate);

    if (daysSinceLastCompletion > 1) {
      currentStreak = 0;
    }

    return { currentStreak, longestStreak, streakHistory };
  }

  static getWeekRange(date: Date, timezone: string): { start: Date; end: Date } {
    return {
      start: this.startOfWeekInTimezone(date, timezone),
      end: this.endOfWeekInTimezone(date, timezone),
    };
  }

  static getMonthRange(date: Date, timezone: string): { start: Date; end: Date } {
    return {
      start: this.startOfMonthInTimezone(date, timezone),
      end: this.endOfMonthInTimezone(date, timezone),
    };
  }
}

export default DateUtil;
