// Export all models for easy importing
export { default as User } from './User';
export { default as Habit } from './Habit';
export { default as HabitLog } from './HabitLog';
export { default as Goal } from './Goal';
export { default as Achievement } from './Achievement';
export { default as UserAchievement } from './UserAchievement';
export { default as Session } from './Session';
export { default as Notification } from './Notification';

// Export types
export type { IUser } from './User';
export type { IHabit, Frequency, Difficulty } from './Habit';
export type { IHabitLog } from './HabitLog';
export type { IGoal, GoalStatus } from './Goal';
export type { IAchievement } from './Achievement';
export type { IUserAchievement } from './UserAchievement';
export type { ISession } from './Session';
export type { INotification, NotificationType } from './Notification';
