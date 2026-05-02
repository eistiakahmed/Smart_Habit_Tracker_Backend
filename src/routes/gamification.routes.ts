import { Router } from 'express';
import gamificationController from '@/controllers/gamification.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';
import validate from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All gamification routes require authentication
router.use(authenticate);

// Stats routes
/**
 * @swagger
 * /api/v1/gamification/stats:
 *   get:
 *     summary: Get user gamification stats
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gamification stats retrieved successfully
 */
router.get('/stats', gamificationController.getUserGamificationStats);

/**
 * @swagger
 * /api/v1/gamification/rank:
 *   get:
 *     summary: Get user rank
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User rank retrieved successfully
 */
router.get('/rank', gamificationController.getUserRank);

// Leaderboard routes
/**
 * @swagger
 * /api/v1/gamification/leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, week, month]
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 */
router.get('/leaderboard', gamificationController.getLeaderboard);

// Streak freeze
const useStreakFreezeSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
});

/**
 * @swagger
 * /api/v1/gamification/streak-freeze:
 *   post:
 *     summary: Use a streak freeze
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - habitId
 *             properties:
 *               habitId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streak freeze used successfully
 */
router.post('/streak-freeze', validate(useStreakFreezeSchema), gamificationController.useStreakFreeze);

// Achievements routes
/**
 * @swagger
 * /api/v1/gamification/achievements:
 *   get:
 *     summary: Get all available achievements
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 */
router.get('/achievements', gamificationController.getAllAchievements);

/**
 * @swagger
 * /api/v1/gamification/achievements/my:
 *   get:
 *     summary: Get user achievements
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User achievements retrieved successfully
 */
router.get('/achievements/my', gamificationController.getUserAchievements);

/**
 * @swagger
 * /api/v1/gamification/achievements/check:
 *   post:
 *     summary: Check and unlock achievements
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Achievement check completed
 */
router.post('/achievements/check', gamificationController.checkAchievements);

// Challenges routes
/**
 * @swagger
 * /api/v1/gamification/challenges:
 *   get:
 *     summary: Get active challenges
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active challenges retrieved successfully
 */
router.get('/challenges', gamificationController.getActiveChallenges);

/**
 * @swagger
 * /api/v1/gamification/challenges/my:
 *   get:
 *     summary: Get user challenges
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User challenges retrieved successfully
 */
router.get('/challenges/my', gamificationController.getUserChallenges);

/**
 * @swagger
 * /api/v1/gamification/challenges/{id}/join:
 *   post:
 *     summary: Join a challenge
 *     tags: [Gamification]
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
 *         description: Challenge joined successfully
 */
router.post('/challenges/:id/join', validate(commonIdParamSchema, 'params'), gamificationController.joinChallenge);

/**
 * @swagger
 * /api/v1/gamification/challenges/{id}/progress:
 *   post:
 *     summary: Update challenge progress
 *     tags: [Gamification]
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
 *         description: Challenge progress updated
 */
router.post('/challenges/:id/progress', validate(commonIdParamSchema, 'params'), gamificationController.updateChallengeProgress);

export default router;
