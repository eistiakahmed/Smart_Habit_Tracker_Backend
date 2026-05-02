import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import JwtUtil from '@/utils/jwt';
import ResponseUtil from '@/utils/response';
import logger from '@/utils/logger';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      ResponseUtil.unauthorized(res, 'No token provided');
      return;
    }

    const decoded = JwtUtil.verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username || '',
    };

    next();
  } catch (error: any) {
    logger.error('Authentication error:', error);
    ResponseUtil.unauthorized(res, error.message || 'Invalid or expired token');
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      if (token) {
        try {
          const decoded = JwtUtil.verifyAccessToken(token);
          req.user = {
            id: decoded.userId,
            email: decoded.email,
            username: decoded.username || '',
          };
        } catch (error) {
          // Continue without authentication
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export default { authenticate, optionalAuth };
