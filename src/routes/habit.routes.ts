import { Router } from 'express';
import habitController from '@/controllers/habit.controller';
import { authenticate } from '@/middleware/auth.middleware';
import validate from '@/middleware/validation.middleware';
import { createHabitSchema, updateHabitSchema, toggleHabitSchema } from '@/validators/habit.validator';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';

const router = Router();

// All habit routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/habits:
 *   get:
 *     summary: Get all user habits
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Habits retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', habitController.getAllHabits);

/**
 * @swagger
 * /api/v1/habits:
 *   post:
 *     summary: Create a new habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [DAILY, WEEKLY, CUSTOM]
 *               targetDays:
 *                 type: integer
 *               reminderTime:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *     responses:
 *       201:
 *         description: Habit created successfully
 *       400:
 *         description: Validation error or limit reached
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createHabitSchema), habitController.createHabit);

/**
 * @swagger
 * /api/v1/habits/{id}:
 *   get:
 *     summary: Get habit details
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Habit retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.get('/:id', validate(commonIdParamSchema, 'params'), habitController.getHabitById);

/**
 * @swagger
 * /api/v1/habits/{id}:
 *   put:
 *     summary: Update habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               frequency:
 *                 type: string
 *               targetDays:
 *                 type: integer
 *               reminderTime:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Habit updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.put('/:id', validate(commonIdParamSchema, 'params'), validate(updateHabitSchema), habitController.updateHabit);

/**
 * @swagger
 * /api/v1/habits/{id}:
 *   delete:
 *     summary: Delete habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Habit deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.delete('/:id', validate(commonIdParamSchema, 'params'), habitController.deleteHabit);

/**
 * @swagger
 * /api/v1/habits/{id}/toggle:
 *   post:
 *     summary: Toggle habit completion
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               mood:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Habit toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.post('/:id/toggle', validate(commonIdParamSchema, 'params'), validate(toggleHabitSchema), habitController.toggleHabit);

/**
 * @swagger
 * /api/v1/habits/{id}/progress:
 *   get:
 *     summary: Get habit progress
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Habit progress retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.get('/:id/progress', validate(commonIdParamSchema, 'params'), habitController.getHabitProgress);

/**
 * @swagger
 * /api/v1/habits/{id}/streak:
 *   get:
 *     summary: Get habit streak information
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Habit streak retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Habit not found
 */
router.get('/:id/streak', validate(commonIdParamSchema, 'params'), habitController.getHabitStreak);

export default router;
