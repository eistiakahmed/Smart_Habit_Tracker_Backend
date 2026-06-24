import { Router, type Router as RouterType } from 'express';
import categoryController from '@/controllers/category.controller';
import { authenticate } from '@/middleware/auth.middleware';
import validate from '@/middleware/validation.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from '@/validators/category.validator';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';

const router: RouterType = Router();

// All category routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get user's categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeDefault
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include system default categories in response
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create custom category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - icon
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 description: Category name (must be unique per user)
 *               icon:
 *                 type: string
 *                 description: Lucide icon name (e.g., 'circle', 'star', 'heart')
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 description: Hex color code (e.g., '#3B82F6')
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error or duplicate category name
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createCategorySchema), categoryController.createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error, duplicate name, or attempting to update default category
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.put(
  '/:id',
  validate(commonIdParamSchema, 'params'),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reassignToCategoryId:
 *                 type: string
 *                 description: ID of category to reassign habits to (required if category has habits)
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete default category or category with habits without reassignment
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  validate(commonIdParamSchema, 'params'),
  validate(deleteCategorySchema),
  categoryController.deleteCategory
);

/**
 * @swagger
 * /api/categories/default:
 *   get:
 *     summary: Get default categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default categories retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/default', categoryController.getDefaultCategories);

export default router;
