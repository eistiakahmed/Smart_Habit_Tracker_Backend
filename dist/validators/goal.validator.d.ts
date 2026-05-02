import { z } from 'zod';
export declare const createGoalSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    targetValue: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    targetDate: z.ZodString;
    category: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: string;
    targetValue: number;
    targetDate: string;
    description?: string | undefined;
    unit?: string | undefined;
}, {
    title: string;
    category: string;
    targetValue: number;
    targetDate: string;
    description?: string | undefined;
    unit?: string | undefined;
}>;
export declare const updateGoalSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    currentValue: z.ZodOptional<z.ZodNumber>;
    targetValue: z.ZodOptional<z.ZodNumber>;
    targetDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "COMPLETED", "FAILED", "PAUSED"]>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    status?: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED" | undefined;
    title?: string | undefined;
    targetValue?: number | undefined;
    currentValue?: number | undefined;
    targetDate?: string | undefined;
}, {
    description?: string | undefined;
    status?: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED" | undefined;
    title?: string | undefined;
    targetValue?: number | undefined;
    currentValue?: number | undefined;
    targetDate?: string | undefined;
}>;
export declare const goalQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "COMPLETED", "FAILED", "PAUSED"]>>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED" | undefined;
    category?: string | undefined;
}, {
    status?: "ACTIVE" | "COMPLETED" | "FAILED" | "PAUSED" | undefined;
    category?: string | undefined;
}>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalQueryInput = z.infer<typeof goalQuerySchema>;
//# sourceMappingURL=goal.validator.d.ts.map