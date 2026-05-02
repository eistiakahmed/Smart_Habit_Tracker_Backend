import { Response } from 'express';
import socialService from '@/services/social.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class SocialController {
  // Friends
  async sendFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { receiverId, message } = req.body;

      if (!receiverId) {
        ResponseUtil.badRequest(res, 'Receiver ID is required');
        return;
      }

      const result = await socialService.sendFriendRequest(req.user!.id, receiverId, message);

      if (result.alreadyFriends) {
        ResponseUtil.badRequest(res, 'Already friends with this user');
        return;
      }

      if (result.alreadyPending) {
        ResponseUtil.badRequest(res, 'Friend request already pending');
        return;
      }

      ResponseUtil.created(res, { success: true }, 'Friend request sent');
    } catch (error: any) {
      logger.error('Send friend request error:', error);
      ResponseUtil.serverError(res, 'Failed to send friend request');
    }
  }

  async respondToFriendRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { accept } = req.body;

      if (typeof accept !== 'boolean') {
        ResponseUtil.badRequest(res, 'Accept field must be a boolean');
        return;
      }

      const result = await socialService.respondToFriendRequest(requestId, req.user!.id, accept);
      ResponseUtil.success(res, result, accept ? 'Friend request accepted' : 'Friend request declined');
    } catch (error: any) {
      logger.error('Respond to friend request error:', error);

      if (error.message === 'Friend request not found' || error.message === 'Not authorized to respond to this request') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to respond to friend request');
    }
  }

  async getFriends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const friends = await socialService.getFriends(req.user!.id);
      ResponseUtil.success(res, { friends });
    } catch (error: any) {
      logger.error('Get friends error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch friends');
    }
  }

  async getPendingRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const requests = await socialService.getPendingRequests(req.user!.id);
      ResponseUtil.success(res, { requests });
    } catch (error: any) {
      logger.error('Get pending requests error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch pending requests');
    }
  }

  async removeFriend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { friendId } = req.params;

      if (!friendId) {
        ResponseUtil.badRequest(res, 'Friend ID is required');
        return;
      }

      await socialService.removeFriend(req.user!.id, friendId);
      ResponseUtil.success(res, { success: true }, 'Friend removed');
    } catch (error: any) {
      logger.error('Remove friend error:', error);
      ResponseUtil.serverError(res, 'Failed to remove friend');
    }
  }

  async blockUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        ResponseUtil.badRequest(res, 'User ID is required');
        return;
      }

      await socialService.blockUser(req.user!.id, userId);
      ResponseUtil.success(res, { success: true }, 'User blocked');
    } catch (error: any) {
      logger.error('Block user error:', error);
      ResponseUtil.serverError(res, 'Failed to block user');
    }
  }

  // Activity
  async getFriendActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await socialService.getFriendActivity(req.user!.id, limit);
      ResponseUtil.success(res, { activities });
    } catch (error: any) {
      logger.error('Get friend activity error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch friend activity');
    }
  }

  async shareHabitProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { habitId, message } = req.body;

      if (!habitId) {
        ResponseUtil.badRequest(res, 'Habit ID is required');
        return;
      }

      await socialService.shareHabitProgress(req.user!.id, habitId, message);
      ResponseUtil.success(res, { success: true }, 'Habit progress shared');
    } catch (error: any) {
      logger.error('Share habit progress error:', error);
      ResponseUtil.serverError(res, 'Failed to share habit progress');
    }
  }

  // Accountability
  async createAccountabilityPartnership(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { partnerId, sharedHabits } = req.body;

      if (!partnerId) {
        ResponseUtil.badRequest(res, 'Partner ID is required');
        return;
      }

      const result = await socialService.createAccountabilityPartnership(req.user!.id, partnerId, sharedHabits || []);
      ResponseUtil.created(res, result, 'Accountability partnership created');
    } catch (error: any) {
      logger.error('Create accountability partnership error:', error);

      if (error.message === 'Must be friends to become accountability partners') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to create accountability partnership');
    }
  }

  async getFriendProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { friendId } = req.params;

      if (!friendId) {
        ResponseUtil.badRequest(res, 'Friend ID is required');
        return;
      }

      const progress = await socialService.getFriendProgress(req.user!.id, friendId);
      ResponseUtil.success(res, progress);
    } catch (error: any) {
      logger.error('Get friend progress error:', error);

      if (error.message === 'Not authorized to view this profile') {
        ResponseUtil.forbidden(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch friend progress');
    }
  }

  // Leaderboard
  async getSocialLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const leaderboard = await socialService.getLeaderboardWithFriends(req.user!.id);
      ResponseUtil.success(res, leaderboard);
    } catch (error: any) {
      logger.error('Get social leaderboard error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch leaderboard');
    }
  }
}

export default new SocialController();
