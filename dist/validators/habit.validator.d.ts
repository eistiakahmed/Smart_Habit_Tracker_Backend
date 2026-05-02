import { z } from 'zod';
export declare const createHabitSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodEnum<["DAILY", "WEEKLY", "CUSTOM"]>>;
    targetDays: z.ZodOptional<z.ZodNumber>;
    reminderTime: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["EASY", "MEDIUM", "HARD"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: string;
    description?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    frequency?: "DAILY" | "WEEKLY" | "CUSTOM" | undefined;
    targetDays?: number | undefined;
    reminderTime?: string | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
}, {
    title: string;
    category: string;
    description?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    frequency?: "DAILY" | "WEEKLY" | "CUSTOM" | undefined;
    targetDays?: number | undefined;
    reminderTime?: string | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
}>;
export declare const updateHabitSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    frequency: z.ZodOptional<z.ZodEnum<["DAILY", "WEEKLY", "CUSTOM"]>>;
    targetDays: z.ZodOptional<z.ZodNumber>;
    reminderTime: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["EASY", "MEDIUM", "HARD"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    frequency?: "DAILY" | "WEEKLY" | "CUSTOM" | undefined;
    targetDays?: number | undefined;
    reminderTime?: string | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
}, {
    isActive?: boolean | undefined;
    description?: string | undefined;
    title?: string | undefined;
    category?: string | undefined;
    color?: string | undefined;
    icon?: string | undefined;
    frequency?: "DAILY" | "WEEKLY" | "CUSTOM" | undefined;
    targetDays?: number | undefined;
    reminderTime?: string | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
}>;
export declare const toggleHabitSchema: z.ZodObject<{
    note: z.ZodOptional<z.ZodString>;
    mood: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    note?: string | undefined;
    mood?: number | undefined;
}, {
    note?: string | undefined;
    mood?: number | undefined;
}>;
export declare const habitQuerySchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodEnum<["true", "false"]>>;
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isActive?: "true" | "false" | undefined;
    limit?: string | undefined;
    category?: string | undefined;
    page?: string | undefined;
}, {
    isActive?: "true" | "false" | undefined;
    limit?: string | undefined;
    category?: string | undefined;
    page?: string | undefined;
}>;
export declare const habitProgressQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ToggleHabitInput = z.infer<typeof toggleHabitSchema>;
export type HabitQueryInput = z.infer<typeof habitQuerySchema>;
export type HabitProgressQueryInput = z.infer<typeof habitProgressQuerySchema>;
//# sourceMappingURL=habit.validator.d.ts.map