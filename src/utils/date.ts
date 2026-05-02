import { addDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export class DateUtil {
  static getUserTimezoneDate(date: Date, timezone: string): Date {
    return utcToZonedTime(date, timezone);
  }

  static startOfDayInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return startOfDay(zonedDate);
  }

  static endOfDayInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return endOfDay(zonedDate);
  }

  static startOfWeekInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday
  }

  static endOfWeekInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return endOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday
  }

  static startOfMonthInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return startOfMonth(zonedDate);
  }

  static endOfMonthInTimezone(date: Date, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return endOfMonth(zonedDate);
  }

  static addDaysInTimezone(date: Date, days: number, timezone: string): Date {
    const zonedDate = utcToZonedTime(date, timezone);
    return addDays(zonedDate, days);
  }

  static getDaysBetween(startDate: Date, endDate: Date): number {
    return differenceInDays(endDate, startDate) + 1;
  }

  static isToday(date: Date, timezone: string): boolean {
    const today = this.getUserTimezoneDate(new Date(), timezone);
    const compareDate = this.getUserTimezoneDate(date, timezone);
    return (
      today.getDate() === compareDate.getDate() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getFullYear() === compareDate.getFullYear()
    );
  }

  static formatDateForUser(date: Date, timezone: string, format: string = 'yyyy-MM-dd'): string {
    const zonedDate = utcToZonedTime(date, timezone);
    // Use date-fns format here
    return format; // Placeholder, implement with date-fns format
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
