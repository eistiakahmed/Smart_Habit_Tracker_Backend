import { Types } from 'mongoose';
import { User, FriendRequest, SocialActivity, Habit, HabitLog } from '@/models';
import logger from '@/utils/logger';

class SocialService {
  async sendFriendRequest(senderId: string, receiverId: string, message?: string): Promise<{
    success: boolean;
    alreadyFriends: boolean;
    alreadyPending: boolean;
  }> {
    try {
      if (senderId === receiverId) {
        throw new Error('Cannot send friend request to yourself');
      }

      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      // Check if already friends
      if (sender.friends?.includes(new Types.ObjectId(receiverId))) {
        return { success: false, alreadyFriends: true, alreadyPending: false };
      }

      // Check if request already pending
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { senderId: new Types.ObjectId(senderId), receiverId: new Types.ObjectId(receiverId) },
          { senderId: new Types.ObjectId(receiverId), receiverId: new Types.ObjectId(senderId) },
        ],
        status: 'PENDING',
      });

      if (existingRequest) {
        return { success: false, alreadyFriends: false, alreadyPending: true };
      }

      // Create friend request
      await FriendRequest.create({
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(receiverId),
        status: 'PENDING',
        message,
      });

      // Add to pending friends
      await User.findByIdAndUpdate(receiverId, {
        $push: { pendingFriends: new Types.ObjectId(senderId) },
      });

      // Create social activity
      await SocialActivity.create({
        userId: new Types.ObjectId(senderId),
        type: 'FRIEND_REQUEST',
        data: {
          receiverId,
          senderName: sender.username,
          message,
        },
        isPublic: false,
      });

      logger.info(`Friend request sent from ${senderId} to ${receiverId}`);

      return { success: true, alreadyFriends: false, alreadyPending: false };
    } catch (error: any) {
      logger.error('Send friend request error:', error);
      throw error;
    }
  }

  async respondToFriendRequest(
    requestId: string,
    userId: string,
    accept: boolean
  ): Promise<{
    success: boolean;
    friend?: any;
  }> {
    try {
      const request = await FriendRequest.findById(requestId);

      if (!request) {
        throw new Error('Friend request not found');
      }

      if (request.receiverId.toString() !== userId) {
        throw new Error('Not authorized to respond to this request');
      }

      if (request.status !== 'PENDING') {
        throw new Error('Friend request already processed');
      }

      const senderId = request.senderId.toString();

      if (accept) {
        // Add to both users' friends lists
        await User.findByIdAndUpdate(userId, {
          $push: { friends: new Types.ObjectId(senderId) },
          $pull: { pendingFriends: new Types.ObjectId(senderId) },
        });

        await User.findByIdAndUpdate(senderId, {
          $push: { friends: new Types.ObjectId(userId) },
        });

        // Update request status
        request.status = 'ACCEPTED';
        request.respondedAt = new Date();
        await request.save();

        // Create social activities
        await SocialActivity.create({
          userId: new Types.ObjectId(userId),
          type: 'FRIEND_ACCEPTED',
          data: {
            friendId: senderId,
            friendName: (await User.findById(senderId))?.username,
          },
          isPublic: true,
        });

        logger.info(`Friend request accepted: ${requestId}`);

        const friend = await User.findById(senderId).select('username avatar level points bio');

        return { success: true, friend };
      } else {
        // Decline request
        request.status = 'DECLINED';
        request.respondedAt = new Date();
        await request.save();

        await User.findByIdAndUpdate(userId, {
          $pull: { pendingFriends: new Types.ObjectId(senderId) },
        });

        logger.info(`Friend request declined: ${requestId}`);

        return { success: true };
      }
    } catch (error: any) {
      logger.error('Respond to friend request error:', error);
      throw error;
    }
  }

  async getFriends(userId: string): Promise<Array<{
    id: string;
    username: string;
    avatar?: string;
    level: number;
    points: number;
    bio?: string;
    isOnline: boolean;
  }>> {
    try {
      const user = await User.findById(userId).populate('friends', 'username avatar level points bio lastActive');

      if (!user) {
        throw new Error('User not found');
      }

      const friends = (user.friends || []).map((friend: any) => ({
        id: friend._id.toString(),
        username: friend.username,
        avatar: friend.avatar,
        level: friend.level,
        points: friend.points,
        bio: friend.bio,
        isOnline: this.isUserOnline(friend.lastActive),
      }));

      return friends;
    } catch (error: any) {
      logger.error('Get friends error:', error);
      throw error;
    }
  }

  async getPendingRequests(userId: string): Promise<Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderLevel: number;
    message?: string;
    createdAt: Date;
  }>> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const requests = await FriendRequest.find({
        receiverId: new Types.ObjectId(userId),
        status: 'PENDING',
      })
        .populate('senderId', 'username avatar level')
        .sort({ createdAt: -1 })
        .lean();

      return requests.map((request) => ({
        id: request._id.toString(),
        senderId: request.senderId._id.toString(),
        senderName: request.senderId.username,
        senderAvatar: request.senderId.avatar,
        senderLevel: request.senderId.level,
        message: request.message,
        createdAt: request.createdAt,
      }));
    } catch (error: any) {
      logger.error('Get pending requests error:', error);
      throw error;
    }
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        $pull: { friends: new Types.ObjectId(friendId) },
      });

      await User.findByIdAndUpdate(friendId, {
        $pull: { friends: new Types.ObjectId(userId) },
      });

      logger.info(`Friend removed: ${userId} - ${friendId}`);
    } catch (error: any) {
      logger.error('Remove friend error:', error);
      throw error;
    }
  }

  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      // Remove from friends if exists
      await this.removeFriend(userId, blockedUserId);

      // Add to blocked list
      await User.findByIdAndUpdate(userId, {
        $push: { blockedUsers: new Types.ObjectId(blockedUserId) },
      });

      logger.info(`User blocked: ${userId} blocked ${blockedUserId}`);
    } catch (error: any) {
      logger.error('Block user error:', error);
      throw error;
    }
  }

  async getFriendActivity(userId: string, limit: number = 20): Promise<Array<{
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    type: string;
    data: any;
    createdAt: Date;
  }>> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const friendIds = user.friends || [];

      const activities = await SocialActivity.find({
        userId: { $in: friendIds },
        isPublic: true,
      })
        .populate('userId', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities.map((activity) => ({
        id: activity._id.toString(),
        userId: activity.userId._id.toString(),
        username: activity.userId.username,
        avatar: activity.userId.avatar,
        type: activity.type,
        data: activity.data,
        createdAt: activity.createdAt,
      }));
    } catch (error: any) {
      logger.error('Get friend activity error:', error);
      throw error;
    }
  }

  async shareHabitProgress(userId: string, habitId: string, message?: string): Promise<void> {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      const user = await User.findById(userId);

      // Create social activity
      await SocialActivity.create({
        userId: new Types.ObjectId(userId),
        type: 'HABIT_SHARED',
        data: {
          habitTitle: habit.title,
          habitCategory: habit.category,
          streak: user?.currentStreak || 0,
          message,
        },
        isPublic: true,
      });

      logger.info(`Habit progress shared: ${habitId} by user ${userId}`);
    } catch (error: any) {
      logger.error('Share habit progress error:', error);
      throw error;
    }
  }

  async createAccountabilityPartnership(
    userId: string,
    partnerId: string,
    sharedHabits: string[]
  ): Promise<{
    partnershipId: string;
  }> {
    try {
      // Check if users are friends
      const user = await User.findById(userId);
      const partner = await User.findById(partnerId);

      if (!user || !partner) {
        throw new Error('User not found');
      }

      if (!user.friends?.includes(new Types.ObjectId(partnerId))) {
        throw new Error('Must be friends to become accountability partners');
      }

      // This is a simplified version - in production, you'd create a separate Partnership model
      // For now, we'll create social activities to mark the partnership
      await SocialActivity.create({
        userId: new Types.ObjectId(userId),
        type: 'CHALLENGE_COMPLETED',
        data: {
          type: 'accountability_partnership',
          partnerId,
          partnerName: partner.username,
          sharedHabits,
        },
        isPublic: true,
      });

      await SocialActivity.create({
        userId: new Types.ObjectId(partnerId),
        type: 'CHALLENGE_COMPLETED',
        data: {
          type: 'accountability_partnership',
          partnerId: userId,
          partnerName: user.username,
          sharedHabits,
        },
        isPublic: true,
      });

      logger.info(`Accountability partnership created: ${userId} - ${partnerId}`);

      return { partnershipId: `${userId}-${partnerId}` };
    } catch (error: any) {
      logger.error('Create accountability partnership error:', error);
      throw error;
    }
  }

  async getFriendProgress(userId: string, friendId: string): Promise<{
    user: {
      id: string;
      username: string;
      avatar?: string;
      level: number;
      points: number;
    };
    stats: {
      totalHabits: number;
      activeHabits: number;
      currentStreak: number;
      completionRate: number;
    };
    recentActivity: Array<{
      type: string;
      data: any;
      createdAt: Date;
    }>;
  }> {
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);

      if (!user || !friend) {
        throw new Error('User not found');
      }

      // Check if friends
      if (!user.friends?.includes(new Types.ObjectId(friendId)) && !user.isPublicProfile) {
        throw new Error('Not authorized to view this profile');
      }

      // Get friend's habits stats
      const habits = await Habit.find({ userId: new Types.ObjectId(friendId), isActive: true });
      const activeHabits = habits.length;

      // Get recent completions
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = await HabitLog.find({
        userId: new Types.ObjectId(friendId),
        completedAt: { $gte: thirtyDaysAgo },
      });

      const uniqueDays = new Set(recentLogs.map((log) => log.completedAt.toDateString())).size;
      const completionRate = uniqueDays > 0 ? (recentLogs.length / (uniqueDays * activeHabits || 1)) * 100 : 0;

      // Get recent activity
      const activities = await SocialActivity.find({
        userId: new Types.ObjectId(friendId),
        isPublic: true,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      return {
        user: {
          id: friend._id.toString(),
          username: friend.username,
          avatar: friend.avatar,
          level: friend.level,
          points: friend.points,
        },
        stats: {
          totalHabits: await Habit.countDocuments({ userId: new Types.ObjectId(friendId) }),
          activeHabits,
          currentStreak: friend.currentStreak,
          completionRate,
        },
        recentActivity: activities.map((a) => ({
          type: a.type,
          data: a.data,
          createdAt: a.createdAt,
        })),
      };
    } catch (error: any) {
      logger.error('Get friend progress error:', error);
      throw error;
    }
  }

  async getLeaderboardWithFriends(userId: string): Promise<{
    global: Array<{
      userId: string;
      username: string;
      avatar?: string;
      level: number;
      points: number;
      rank: number;
      isFriend: boolean;
    }>;
    friends: Array<{
      userId: string;
      username: string;
      avatar?: string;
      level: number;
      points: number;
      rank: number;
    }>;
  }> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const friendIds = user.friends || [];

      // Global leaderboard
      const globalLeaderboard = await User.find()
        .select('username avatar level points')
        .sort({ points: -1, level: -1 })
        .limit(50)
        .lean();

      // Friends leaderboard
      const friendsLeaderboard = await User.find({
        _id: { $in: [...friendIds, new Types.ObjectId(userId)] },
      })
        .select('username avatar level points')
        .sort({ points: -1, level: -1 })
        .lean();

      return {
        global: globalLeaderboard.map((u, index) => ({
          userId: u._id.toString(),
          username: u.username,
          avatar: u.avatar,
          level: u.level,
          points: u.points,
          rank: index + 1,
          isFriend: friendIds.some((f: any) => f.toString() === u._id.toString()),
        })),
        friends: friendsLeaderboard.map((u, index) => ({
          userId: u._id.toString(),
          username: u.username,
          avatar: u.avatar,
          level: u.level,
          points: u.points,
          rank: index + 1,
        })),
      };
    } catch (error: any) {
      logger.error('Get leaderboard with friends error:', error);
      throw error;
    }
  }

  private isUserOnline(lastActive?: Date): boolean {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActive > fiveMinutesAgo;
  }
}

export default new SocialService();
