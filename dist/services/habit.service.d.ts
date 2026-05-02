import { Types } from 'mongoose';
import { CreateHabitData, UpdateHabitData, ToggleHabitData, HabitFilter, HabitStats, HabitProgress, HabitStreak, HabitResponse } from '../types';
declare class HabitService {
    getAllHabits(userId: string, filter?: HabitFilter): Promise<{
        habits: HabitResponse[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getHabitById(habitId: string, userId: string): Promise<HabitResponse & {
        recentLogs: any[];
    }>;
    createHabit(userId: string, data: CreateHabitData): Promise<{
        id: string;
        userId: Types.ObjectId;
        title: string;
        description?: string;
        category: string;
        color: string;
        icon?: string;
        frequency: import("../models/Habit").Frequency;
        targetDays: number;
        startDate: Date;
        endDate?: Date;
        reminderTime?: string;
        isActive: boolean;
        difficulty: import("../models/Habit").Difficulty;
        createdAt: Date;
        updatedAt: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    updateHabit(habitId: string, userId: string, data: UpdateHabitData): Promise<{
        id: string;
        userId: Types.ObjectId;
        title: string;
        description?: string;
        category: string;
        color: string;
        icon?: string;
        frequency: import("../models/Habit").Frequency;
        targetDays: number;
        startDate: Date;
        endDate?: Date;
        reminderTime?: string;
        isActive: boolean;
        difficulty: import("../models/Habit").Difficulty;
        createdAt: Date;
        updatedAt: Date;
        _id: Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    deleteHabit(habitId: string, userId: string): Promise<void>;
    toggleHabit(habitId: string, userId: string, data: ToggleHabitData): Promise<{
        log: null;
        streak: number;
        todayCompleted: boolean;
    } | {
        log: {
            id: string;
            habitId: Types.ObjectId;
            userId: Types.ObjectId;
            completedAt: Date;
            note?: string;
            mood?: number;
            createdAt: Date;
            _id: Types.ObjectId;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        };
        streak: number;
        todayCompleted: boolean;
    }>;
    getHabitStats(habitId: string, userId: string): Promise<HabitStats>;
    getHabitProgress(habitId: string, userId: string, startDate?: Date, endDate?: Date): Promise<HabitProgress>;
    getHabitStreak(habitId: string, userId: string): Promise<HabitStreak>;
    private isCompletedToday;
    private getCurrentStreak;
    private calculateWeeklySummary;
}
declare const _default: HabitService;
export default _default;
//# sourceMappingURL=habit.service.d.ts.map