import { Types } from 'mongoose';
import User, { IUser } from '@/models/User';
import Session from '@/models/Session';
import PasswordUtil from '@/utils/password';
import JwtUtil from '@/utils/jwt';
import logger from '@/utils/logger';
import { AuthResponse, CreateUserData, LoginData } from '@/types';

class AuthService {
  async register(data: CreateUserData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }],
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('Email already registered');
        }
        if (existingUser.username === data.username) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const passwordHash = await PasswordUtil.hash(data.password);

      // Create user
      const user = await User.create({
        email: data.email,
        username: data.username,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        timezone: 'UTC',
      });

      // Generate tokens
      const tokens = JwtUtil.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      });

      // Store refresh token
      await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, tokens.expiresIn);

      logger.info(`New user registered: ${user._id}`);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error: any) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await User.findOne({ email: data.email });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await PasswordUtil.compare(data.password, user.passwordHash);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const tokens = JwtUtil.generateTokenPair({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      });

      // Store refresh token
      await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, tokens.expiresIn);

      // Update last login
      user.updatedAt = new Date();
      await user.save();

      logger.info(`User logged in: ${user._id}`);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error: any) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      // Delete refresh token
      await Session.deleteOne({
        userId: new Types.ObjectId(userId),
        refreshToken,
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error: any) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const payload = JwtUtil.verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const session = await Session.findOne({
        refreshToken,
      }).populate('userId');

      if (!session || session.userId.toString() !== payload.userId) {
        throw new Error('Invalid refresh token');
      }

      if (session.expiresAt < new Date()) {
        // Delete expired session
        await Session.deleteOne({ _id: session._id });
        throw new Error('Refresh token expired');
      }

      // Get user
      const user = await User.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const accessToken = JwtUtil.generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
      });

      const expiresIn = JwtUtil.getTokenExpiration('15m');

      return { accessToken, expiresIn };
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async getMe(userId: string) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error: any) {
      logger.error('Get user error:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, data: any) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: data },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error: any) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  private async storeRefreshToken(userId: string, refreshToken: string, expiresIn: number): Promise<void> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await Session.create({
      userId: new Types.ObjectId(userId),
      refreshToken,
      expiresAt,
    });
  }

  private sanitizeUser(user: IUser): any {
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences || {},
      createdAt: user.createdAt,
    };
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      await Session.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      logger.info('Expired sessions cleaned up');
    } catch (error: any) {
      logger.error('Cleanup sessions error:', error);
    }
  }
}

export default new AuthService();
