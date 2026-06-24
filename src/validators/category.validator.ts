import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name cannot exceed 50 characters'),
  icon: z.string().min(1, 'Icon is required').regex(/^[a-zA-Z0-9-]+$/, 'Icon must be a valid Lucide icon name'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #3B82F6)'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  icon: z.string().regex(/^[a-zA-Z0-9-]+$/, 'Icon must be a valid Lucide icon name').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
});

export const deleteCategorySchema = z.object({
  reassignToCategoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
});

export const categoryQuerySchema = z.object({
  includeDefault: z.enum(['true', 'false']).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
