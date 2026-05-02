import { Router } from 'express';
import socialController from '@/controllers/social.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';
import validate from '@/middleware/validation.middleware';
import { z } from 'zod';

const router = Router();

// All social routes require authentication
router.use(authenticate);

// Friends
const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  message: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/social/friends:
 *   get:
 *     summary: Get user's friends list
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Friends list retrieved successfully
 */
router.get('/friends', socialController.getFriends);

/**
 * @swagger
 * /api/v1/social/friends/requests:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 */
router.get('/friends/requests', socialController.getPendingRequests);

/**
 * @swagger
 * /api/v1/social/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Friend request sent
 */
router.post('/friends/request', validate(sendFriendRequestSchema), socialController.sendFriendRequest);

/**
 * @swagger
 * /api/v1/social/friends/request/{id}/respond:
 *   post:
 *     summary: Respond to a friend request
 *     tags: [Social]
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
 *             required:
 *               - accept
 *             properties:
 *               accept:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Friend request responded
 */
router.post('/friends/request/:id/respond', validate(commonIdParamSchema, 'params'), socialController.respondToFriendRequest);

/**
 * @swagger
 * /api/v1/social/friends/{id}:
 *   delete:
 *     summary: Remove a friend
 *     tags: [Social]
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
 *         description: Friend removed
 */
router.delete('/friends/:id', validate(commonIdParamSchema, 'params'), socialController.removeFriend);

// Block
/**
 * @swagger
 * /api/v1/social/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked
 */
router.post('/block/:userId', validate(commonIdParamSchema, 'params'), socialController.blockUser);

// Activity
/**
 * @swagger
 * /api/v1/social/activity:
 *   get:
 *     summary: Get friends' activity feed
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Activity feed retrieved
 */
router.get('/activity', socialController.getFriendActivity);

const shareHabitSchema = z.object({
  habitId: z.string().min(1, 'Habit ID is required'),
  message: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/social/share:
 *   post:
 *     summary: Share habit progress with friends
 *     tags: [Social]
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
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Habit progress shared
 */
router.post('/share', validate(shareHabitSchema), socialController.shareHabitProgress);

// Accountability
const accountabilitySchema = z.object({
  partnerId: z.string().min(1, 'Partner ID is required'),
  sharedHabits: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/v1/social/accountability:
 *   post:
 *     summary: Create an accountability partnership
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partnerId
 *             properties:
 *               partnerId:
 *                 type: string
 *               sharedHabits:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Accountability partnership created
 */
router.post('/accountability', validate(accountabilitySchema), socialController.createAccountabilityPartnership);

/**
 * @swagger
 * /api/v1/social/friends/{id}/progress:
 *   get:
 *     summary: Get friend's progress
 *     tags: [Social]
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
 *         description: Friend progress retrieved
 */
router.get('/friends/:id/progress', validate(commonIdParamSchema, 'params'), socialController.getFriendProgress);

// Leaderboard
/**
 * @swagger
 * /api/v1/social/leaderboard:
 *   get:
 *     summary: Get social leaderboard (global + friends)
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Social leaderboard retrieved
 */
router.get('/leaderboard', socialController.getSocialLeaderboard);

export default router;
