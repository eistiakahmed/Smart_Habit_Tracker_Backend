import { z } from 'zod';

export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().max(50, 'Icon must not exceed 50 characters').optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
  targetDays: z.number().int().min(1).max(365).optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
  targetDays: z.number().int().min(1).max(365).optional(),
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  isActive: z.boolean().optional(),
});

export const toggleHabitSchema = z.object({
  note: z.string().max(500).optional(),
  mood: z.number().int().min(1).max(5).optional(),
});

export const habitQuerySchema = z.object({
  category: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const habitProgressQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type ToggleHabitInput = z.infer<typeof toggleHabitSchema>;
export type HabitQueryInput = z.infer<typeof habitQuerySchema>;
export type HabitProgressQueryInput = z.infer<typeof habitProgressQuerySchema>;
