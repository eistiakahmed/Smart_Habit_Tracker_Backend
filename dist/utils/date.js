"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtil = void 0;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
class DateUtil {
    static getUserTimezoneDate(date, timezone) {
        return (0, date_fns_tz_1.toZonedTime)(date, timezone);
    }
    static startOfDayInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.startOfDay)(zonedDate);
    }
    static endOfDayInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.endOfDay)(zonedDate);
    }
    static startOfWeekInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.startOfWeek)(zonedDate, { weekStartsOn: 1 });
    }
    static endOfWeekInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.endOfWeek)(zonedDate, { weekStartsOn: 1 });
    }
    static startOfMonthInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.startOfMonth)(zonedDate);
    }
    static endOfMonthInTimezone(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.endOfMonth)(zonedDate);
    }
    static addDaysInTimezone(date, days, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return (0, date_fns_1.addDays)(zonedDate, days);
    }
    static getDaysBetween(startDate, endDate) {
        return (0, date_fns_1.differenceInDays)(endDate, startDate) + 1;
    }
    static isToday(date, timezone) {
        const today = this.getUserTimezoneDate(new Date(), timezone);
        const compareDate = this.getUserTimezoneDate(date, timezone);
        return (today.getDate() === compareDate.getDate() &&
            today.getMonth() === compareDate.getMonth() &&
            today.getFullYear() === compareDate.getFullYear());
    }
    static formatDateForUser(date, timezone) {
        const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, timezone);
        return zonedDate.toISOString().split('T')[0];
    }
    static getStreakDates(completedDates, timezone) {
        if (completedDates.length === 0) {
            return { currentStreak: 0, longestStreak: 0, streakHistory: [] };
        }
        const sortedDates = completedDates
            .map((date) => this.getUserTimezoneDate(date, timezone))
            .sort((a, b) => a.getTime() - b.getTime());
        const streakHistory = [];
        let currentStreak = 1;
        let longestStreak = 1;
        let streakStart = sortedDates[0];
        let streakEnd = sortedDates[0];
        let tempStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currDate = sortedDates[i];
            const dayDiff = (0, date_fns_1.differenceInDays)(currDate, prevDate);
            if (dayDiff === 1) {
                tempStreak++;
                streakEnd = currDate;
                if (this.isToday(currDate, timezone) || (0, date_fns_1.differenceInDays)(new Date(), currDate) === 1) {
                    currentStreak = tempStreak;
                }
            }
            else {
                streakHistory.push({
                    startDate: streakStart,
                    endDate: streakEnd,
                    days: tempStreak,
                });
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
                streakStart = currDate;
                streakEnd = currDate;
            }
        }
        streakHistory.push({
            startDate: streakStart,
            endDate: streakEnd,
            days: tempStreak,
        });
        longestStreak = Math.max(longestStreak, tempStreak);
        const lastDate = sortedDates[sortedDates.length - 1];
        const daysSinceLastCompletion = (0, date_fns_1.differenceInDays)(new Date(), lastDate);
        if (daysSinceLastCompletion > 1) {
            currentStreak = 0;
        }
        return { currentStreak, longestStreak, streakHistory };
    }
    static getWeekRange(date, timezone) {
        return {
            start: this.startOfWeekInTimezone(date, timezone),
            end: this.endOfWeekInTimezone(date, timezone),
        };
    }
    static getMonthRange(date, timezone) {
        return {
            start: this.startOfMonthInTimezone(date, timezone),
            end: this.endOfMonthInTimezone(date, timezone),
        };
    }
}
exports.DateUtil = DateUtil;
exports.default = DateUtil;
//# sourceMappingURL=date.js.map