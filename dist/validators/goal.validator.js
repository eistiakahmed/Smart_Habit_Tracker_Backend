"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalQuerySchema = exports.updateGoalSchema = exports.createGoalSchema = void 0;
const zod_1 = require("zod");
exports.createGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title must not exceed 100 characters'),
    description: zod_1.z.string().max(500, 'Description must not exceed 500 characters').optional(),
    targetValue: zod_1.z.number().int().positive('Target value must be positive'),
    unit: zod_1.z.string().max(20, 'Unit must not exceed 20 characters').optional(),
    targetDate: zod_1.z.string().datetime('Invalid target date'),
    category: zod_1.z.string().min(1, 'Category is required'),
});
exports.updateGoalSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    currentValue: zod_1.z.number().int().min(0).optional(),
    targetValue: zod_1.z.number().int().positive().optional(),
    targetDate: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED']).optional(),
});
exports.goalQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'COMPLETED', 'FAILED', 'PAUSED']).optional(),
    category: zod_1.z.string().optional(),
});
//# sourceMappingURL=goal.validator.js.map