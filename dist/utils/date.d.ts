export declare class DateUtil {
    static getUserTimezoneDate(date: Date, timezone: string): Date;
    static startOfDayInTimezone(date: Date, timezone: string): Date;
    static endOfDayInTimezone(date: Date, timezone: string): Date;
    static startOfWeekInTimezone(date: Date, timezone: string): Date;
    static endOfWeekInTimezone(date: Date, timezone: string): Date;
    static startOfMonthInTimezone(date: Date, timezone: string): Date;
    static endOfMonthInTimezone(date: Date, timezone: string): Date;
    static addDaysInTimezone(date: Date, days: number, timezone: string): Date;
    static getDaysBetween(startDate: Date, endDate: Date): number;
    static isToday(date: Date, timezone: string): boolean;
    static formatDateForUser(date: Date, timezone: string): string;
    static getStreakDates(completedDates: Date[], timezone: string): {
        currentStreak: number;
        longestStreak: number;
        streakHistory: Array<{
            startDate: Date;
            endDate: Date;
            days: number;
        }>;
    };
    static getWeekRange(date: Date, timezone: string): {
        start: Date;
        end: Date;
    };
    static getMonthRange(date: Date, timezone: string): {
        start: Date;
        end: Date;
    };
}
export default DateUtil;
//# sourceMappingURL=date.d.ts.map