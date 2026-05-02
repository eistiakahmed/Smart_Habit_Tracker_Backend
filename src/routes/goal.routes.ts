import { Router } from 'express';
import goalController from '@/controllers/goal.controller';
import { authenticate } from '@/middleware/auth.middleware';
import validate from '@/middleware/validation.middleware';
import { createGoalSchema, updateGoalSchema, goalQuerySchema } from '@/validators/goal.validator';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';

const router = Router();

// All goal routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/goals:
 *   get:
 *     summary: Get all user goals
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, FAILED, PAUSED]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *         description: Goals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     goals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Goal'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', validate(goalQuerySchema, 'query'), goalController.getAllGoals);

/**
 * @swagger
 * /api/v1/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - targetValue
 *               - targetDate
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Read 10 books this year"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Focus on personal development and learning"
 *               targetValue:
 *                 type: number
 *                 minimum: 1
 *                 example: 10
 *               unit:
 *                 type: string
 *                 maxLength: 20
 *                 example: "books"
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-12-31T23:59:59Z"
 *               category:
 *                 type: string
 *                 minLength: 1
 *                 example: "learning"
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Goal created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', validate(createGoalSchema), goalController.createGoal);

/**
 * @swagger
 * /api/v1/goals/stats:
 *   get:
 *     summary: Get goal statistics
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Goal statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     completed:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     paused:
 *                       type: integer
 *                     completionRate:
 *                       type: number
 *                     categoryBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           completionRate:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stats', goalController.getGoalStats);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   get:
 *     summary: Get goal details
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/Goal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validate(commonIdParamSchema, 'params'), goalController.getGoalById);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   put:
 *     summary: Update goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               currentValue:
 *                 type: number
 *                 minimum: 0
 *               targetValue:
 *                 type: number
 *                 minimum: 1
 *               targetDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, COMPLETED, FAILED, PAUSED]
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Goal updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', validate(commonIdParamSchema, 'params'), validate(updateGoalSchema), goalController.updateGoal);

/**
 * @swagger
 * /api/v1/goals/{id}:
 *   delete:
 *     summary: Delete goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Goal deleted successfully"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', validate(commonIdParamSchema, 'params'), goalController.deleteGoal);

/**
 * @swagger
 * /api/v1/goals/{id}/progress:
 *   get:
 *     summary: Get goal progress details
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     goalId:
 *                       type: string
 *                     currentValue:
 *                       type: number
 *                     targetValue:
 *                       type: number
 *                     progress:
 *                       type: number
 *                     daysRemaining:
 *                       type: integer
 *                     daysElapsed:
 *                       type: integer
 *                     onTrack:
 *                       type: boolean
 *                     variance:
 *                       type: object
 *                       properties:
 *                         absolute:
 *                           type: number
 *                         percent:
 *                           type: number
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, COMPLETED, FAILED, PAUSED]
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           percent:
 *                             type: number
 *                           value:
 *                             type: number
 *                           achieved:
 *                             type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/progress', validate(commonIdParamSchema, 'params'), goalController.getGoalProgress);

/**
 * @swagger
 * /api/v1/goals/{id}/progress:
 *   put:
 *     summary: Update goal progress
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: number
 *                 minimum: 0
 *                 description: New current value for the goal
 *                 example: 5
 *     responses:
 *       200:
 *         description: Goal progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Goal progress updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     goal:
 *                       $ref: '#/components/schemas/Goal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/progress', validate(commonIdParamSchema, 'params'), goalController.updateGoalProgress);

export default router;
