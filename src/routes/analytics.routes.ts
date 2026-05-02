import { Router } from 'express';
import analyticsController from '@/controllers/analytics.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/analytics/weekly-report:
 *   get:
 *     summary: Get weekly analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Weekly report retrieved successfully
 */
router.get('/weekly-report', analyticsController.getWeeklyReport);

/**
 * @swagger
 * /api/v1/analytics/monthly-insights:
 *   get:
 *     summary: Get monthly insights and trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly insights retrieved successfully
 */
router.get('/monthly-insights', analyticsController.getMonthlyInsights);

/**
 * @swagger
 * /api/v1/analytics/habit-patterns:
 *   get:
 *     summary: Get habit patterns and best performing times
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Habit patterns retrieved successfully
 */
router.get('/habit-patterns', analyticsController.getHabitPatterns);

/**
 * @swagger
 * /api/v1/analytics/productivity-insights:
 *   get:
 *     summary: Get personalized productivity insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Productivity insights retrieved successfully
 */
router.get('/productivity-insights', analyticsController.getProductivityInsights);

export default router;
