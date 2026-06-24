import { Response } from 'express';
import Category from '@/models/Category';
import Habit from '@/models/Habit';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class CategoryController {
  async getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const includeDefault = req.query.includeDefault === 'true';

      // Get user's custom categories
      const userCategories = await Category.find({ userId: req.user!.id, isDefault: false })
        .sort({ name: 1 });

      let categories = userCategories;

      // Optionally include default categories
      if (includeDefault) {
        const defaultCategories = await Category.find({ isDefault: true }).sort({ name: 1 });
        categories = [...defaultCategories, ...userCategories];
      }

      ResponseUtil.success(res, { categories });
    } catch (error: any) {
      logger.error('Get categories controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch categories');
    }
  }

  async createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, icon, color } = req.body;

      // Check if category with same name exists for this user
      const existingCategory = await Category.findOne({
        userId: req.user!.id,
        name: name.trim(),
      });

      if (existingCategory) {
        ResponseUtil.badRequest(res, 'Category with this name already exists');
        return;
      }

      const category = await Category.create({
        name: name.trim(),
        userId: req.user!.id,
        icon,
        color,
        isDefault: false,
      });

      ResponseUtil.created(res, { category }, 'Category created successfully');
    } catch (error: any) {
      logger.error('Create category controller error:', error);

      if (error.code === 11000) {
        ResponseUtil.badRequest(res, 'Category with this name already exists');
        return;
      }

      if (error.name === 'ValidationError') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to create category');
    }
  }

  async updateCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find the category
      const category = await Category.findOne({ _id: id, userId: req.user!.id });

      if (!category) {
        ResponseUtil.notFound(res, 'Category not found');
        return;
      }

      // Prevent updating default categories
      if (category.isDefault) {
        ResponseUtil.badRequest(res, 'Cannot update default categories');
        return;
      }

      // If updating name, check for uniqueness
      if (updates.name && updates.name !== category.name) {
        const existingCategory = await Category.findOne({
          userId: req.user!.id,
          name: updates.name.trim(),
          _id: { $ne: id },
        });

        if (existingCategory) {
          ResponseUtil.badRequest(res, 'Category with this name already exists');
          return;
        }
      }

      // Apply updates
      if (updates.name) category.name = updates.name.trim();
      if (updates.icon) category.icon = updates.icon;
      if (updates.color) category.color = updates.color;

      await category.save();

      ResponseUtil.success(res, { category }, 'Category updated successfully');
    } catch (error: any) {
      logger.error('Update category controller error:', error);

      if (error.name === 'ValidationError') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to update category');
    }
  }

  async deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reassignToCategoryId } = req.body;

      // Find the category
      const category = await Category.findOne({ _id: id, userId: req.user!.id });

      if (!category) {
        ResponseUtil.notFound(res, 'Category not found');
        return;
      }

      // Prevent deleting default categories
      if (category.isDefault) {
        ResponseUtil.badRequest(res, 'Cannot delete default categories');
        return;
      }

      // Check if category has habits
      const habitsCount = await Habit.countDocuments({
        userId: req.user!.id,
        category: id
      });

      if (habitsCount > 0) {
        // If reassignToCategoryId is provided, reassign habits
        if (reassignToCategoryId) {
          // Verify the target category exists and belongs to user or is default
          const targetCategory = await Category.findOne({
            $or: [
              { _id: reassignToCategoryId, userId: req.user!.id },
              { _id: reassignToCategoryId, isDefault: true },
            ],
          });

          if (!targetCategory) {
            ResponseUtil.badRequest(res, 'Target category not found');
            return;
          }

          // Reassign all habits to the target category
          await Habit.updateMany(
            { userId: req.user!.id, category: id },
            { category: reassignToCategoryId }
          );
        } else {
          ResponseUtil.badRequest(
            res,
            `Cannot delete category with ${habitsCount} habit(s). Please reassign habits to another category first.`
          );
          return;
        }
      }

      // Delete the category
      await Category.deleteOne({ _id: id });

      ResponseUtil.success(
        res,
        { reassignedHabits: reassignToCategoryId ? habitsCount : 0 },
        'Category deleted successfully'
      );
    } catch (error: any) {
      logger.error('Delete category controller error:', error);
      ResponseUtil.serverError(res, 'Failed to delete category');
    }
  }

  async getDefaultCategories(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const defaultCategories = await Category.find({ isDefault: true }).sort({ name: 1 });

      ResponseUtil.success(res, { categories: defaultCategories });
    } catch (error: any) {
      logger.error('Get default categories controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch default categories');
    }
  }
}

export default new CategoryController();
