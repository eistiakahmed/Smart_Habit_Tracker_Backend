"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.habitProgressQuerySchema = exports.habitQuerySchema = exports.toggleHabitSchema = exports.updateHabitSchema = exports.createHabitSchema = void 0;
const zod_1 = require("zod");
exports.createHabitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
    description: zod_1.z.string().max(500, 'Description must not exceed 500 characters').optional(),
    category: zod_1.z.string().min(1, 'Category is required'),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
    icon: zod_1.z.string().max(50, 'Icon must not exceed 50 characters').optional(),
    frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
    targetDays: zod_1.z.number().int().min(1).max(365).optional(),
    reminderTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});
exports.updateHabitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.string().min(1).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    icon: zod_1.z.string().max(50).optional(),
    frequency: zod_1.z.enum(['DAILY', 'WEEKLY', 'CUSTOM']).optional(),
    targetDays: zod_1.z.number().int().min(1).max(365).optional(),
    reminderTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    difficulty: zod_1.z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.toggleHabitSchema = zod_1.z.object({
    note: zod_1.z.string().max(500).optional(),
    mood: zod_1.z.number().int().min(1).max(5).optional(),
});
exports.habitQuerySchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    isActive: zod_1.z.enum(['true', 'false']).optional(),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
exports.habitProgressQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=habit.validator.js.map