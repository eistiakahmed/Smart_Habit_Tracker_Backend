export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: ApiError;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface JwtPayload {
    userId: string;
    email: string;
    username: string;
    type: 'access' | 'refresh';
    exp?: number;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface AuthResponse {
    user: UserResponse;
    tokens: TokenPair;
}
export interface UserResponse {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    preferences: Record<string, any>;
    createdAt: Date;
}
export interface CreateUserData {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    timezone?: string;
    preferences?: Record<string, any>;
}
export interface HabitResponse {
    id: string;
    userId: string;
    title: string;
    description?: string;
    category: string;
    color: string;
    icon?: string;
    frequency: Frequency;
    targetDays: number;
    startDate: Date;
    endDate?: Date;
    reminderTime?: string;
    isActive: boolean;
    difficulty: Difficulty;
    stats?: HabitStats;
    todayCompleted?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface HabitStats {
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
    daysCompleted: number;
    totalDays: number;
    averageMood?: number;
}
export interface CreateHabitData {
    title: string;
    description?: string;
    category: string;
    color?: string;
    icon?: string;
    frequency?: Frequency;
    targetDays?: number;
    reminderTime?: string;
    difficulty?: Difficulty;
}
export interface UpdateHabitData {
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    icon?: string;
    frequency?: Frequency;
    targetDays?: number;
    reminderTime?: string;
    difficulty?: Difficulty;
    isActive?: boolean;
}
export interface ToggleHabitData {
    note?: string;
    mood?: number;
}
export interface HabitFilter {
    category?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export interface HabitLogResponse {
    id: string;
    habitId: string;
    userId: string;
    completedAt: Date;
    note?: string;
    mood?: number;
}
export interface CreateHabitLogData {
    note?: string;
    mood?: number;
}
export interface GoalResponse {
    id: string;
    userId: string;
    title: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    unit?: string;
    startDate: Date;
    targetDate: Date;
    status: GoalStatus;
    category: string;
    progress?: number;
    daysRemaining?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateGoalData {
    title: string;
    description?: string;
    targetValue: number;
    unit?: string;
    targetDate: Date;
    category: string;
}
export interface UpdateGoalData {
    title?: string;
    description?: string;
    currentValue?: number;
    targetValue?: number;
    targetDate?: Date;
    status?: GoalStatus;
}
export interface AchievementResponse {
    id: string;
    title: string;
    description: string;
    icon: string;
    badgeColor: string;
    requirement: Record<string, any>;
    points: number;
    category: string;
    unlocked?: boolean;
    unlockedAt?: Date;
    progress?: number;
}
export interface UserAchievementResponse {
    achievement: AchievementResponse;
    progress: number;
    unlockedAt?: Date;
}
export interface DashboardStats {
    overview: {
        totalHabits: number;
        activeHabits: number;
        completedToday: number;
        completionRateToday: number;
        currentStreaks: number;
        totalCompletions: number;
    };
    topHabits: Array<{
        id: string;
        title: string;
        completionRate: number;
        currentStreak: number;
    }>;
    weeklyTrend: Array<{
        date: string;
        completed: number;
        total: number;
    }>;
    categoryBreakdown: Array<{
        category: string;
        count: number;
        completionRate: number;
    }>;
}
export interface HabitProgress {
    habitId: string;
    period: {
        startDate: Date;
        endDate: Date;
    };
    stats: HabitStats;
    dailyProgress: Array<{
        date: string;
        completed: boolean;
        mood?: number;
    }>;
    weeklySummary: Array<{
        weekStart: string;
        weekEnd: string;
        completed: number;
        total: number;
        rate: number;
    }>;
}
export interface HabitStreak {
    currentStreak: number;
    longestStreak: number;
    streakHistory: Array<{
        startDate: string;
        endDate: string;
        days: number;
    }>;
    milestones: Array<{
        days: number;
        achieved: boolean;
        date?: string;
    }>;
}
export interface WeeklyReport {
    week: {
        start: string;
        end: string;
    };
    summary: {
        totalHabits: number;
        totalCompletions: number;
        completionRate: number;
        perfectDays: number;
        bestDay: string;
    };
    dailyBreakdown: Array<{
        date: string;
        dayOfWeek: string;
        completed: number;
        total: number;
        rate: number;
    }>;
    habitsPerformance: Array<{
        habitId: string;
        title: string;
        completed: number;
        total: number;
        rate: number;
        streak: number;
    }>;
}
export interface NotificationResponse {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
}
export declare enum Frequency {
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    CUSTOM = "CUSTOM"
}
export declare enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}
export declare enum GoalStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    PAUSED = "PAUSED"
}
export declare enum NotificationType {
    HABIT_REMINDER = "HABIT_REMINDER",
    ACHIEVEMENT_UNLOCKED = "ACHIEVEMENT_UNLOCKED",
    GOAL_COMPLETED = "GOAL_COMPLETED",
    STREAK_MILESTONE = "STREAK_MILESTONE",
    WEEKLY_REPORT = "WEEKLY_REPORT"
}
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        username: string;
    };
}
//# sourceMappingURL=index.d.ts.map