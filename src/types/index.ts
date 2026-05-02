// API Response Types
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

// Auth Types
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

// User Types
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
  avatar?: string;
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

// Habit Types
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

// Habit Log Types
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

// Goal Types
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

export interface GoalFilter {
  status?: GoalStatus;
  category?: string;
  page?: number;
  limit?: number;
}

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  daysRemaining: number;
  daysElapsed: number;
  onTrack: boolean;
  variance: {
    absolute: number;
    percent: number;
  };
  status: GoalStatus;
  milestones: Array<{
    percent: number;
    value: number;
    achieved: boolean;
    achievedAt?: Date;
  }>;
}

// Achievement Types
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

// Analytics Types
export interface DailyProgress {
  date: string;
  summary: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    averageMood: number;
    currentStreak: number;
  };
  habits: Array<{
    habitId: string;
    title: string;
    category: string;
    completed: boolean;
    completedAt?: Date;
    mood?: number;
    note?: string;
    streak: number;
    icon?: string;
    color: string;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    completed: number;
  }>;
  comparison: {
    previousDay: {
      date: string;
      completionRate: number;
      completed: number;
    };
    change: {
      rate: number;
      completed: number;
    };
  };
  upcomingReminders: Array<{
    habitId: string;
    title: string;
    reminderTime: string;
  }>;
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

// Enums
export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

// Express Request Extension
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
  file?: Express.Multer.File;
  fileUploaded?: boolean;
}
