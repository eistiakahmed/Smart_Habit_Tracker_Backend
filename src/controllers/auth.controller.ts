import { Response } from 'express';
import authService from '@/services/auth.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class AuthController {
  async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error: any) {
      logger.error('Register controller error:', error);

      if (error.message.includes('already')) {
        ResponseUtil.conflict(res, error.message);
        return;
      }

      ResponseUtil.badRequest(res, error.message);
    }
  }

  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      ResponseUtil.success(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Login controller error:', error);
      ResponseUtil.unauthorized(res, error.message || 'Invalid credentials');
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await authService.logout(req.user!.id, refreshToken);
      ResponseUtil.success(res, null, 'Logged out successfully');
    } catch (error: any) {
      logger.error('Logout controller error:', error);
      ResponseUtil.serverError(res, 'Logout failed');
    }
  }

  async refresh(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);
      ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Refresh token controller error:', error);
      ResponseUtil.unauthorized(res, error.message || 'Invalid refresh token');
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      ResponseUtil.success(res, user);
    } catch (error: any) {
      logger.error('Get me controller error:', error);
      ResponseUtil.notFound(res, error.message);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      ResponseUtil.success(res, user, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile controller error:', error);
      ResponseUtil.serverError(res, 'Update failed');
    }
  }
}

export default new AuthController();
