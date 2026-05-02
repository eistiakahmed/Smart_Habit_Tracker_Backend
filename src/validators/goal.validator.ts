import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  targetValue: z.number().int().positive('Target value must be positive'),
  unit: z.string().max(20, 'Unit must not exceed 20 characters').optional(),
  targetDate: z.string().datetime('Invalid target date'),
  category: z.string().min(1, 'Category is required'),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  currentValue: z.number().int().min(0).optional(),
  targetValue: z.number().int().positive().optional(),
  targetDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED']).optional(),
});

export const goalQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED']).optional(),
  category: z.string().optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalQueryInput = z.infer<typeof goalQuerySchema>;
