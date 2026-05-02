import { Request, Response, NextFunction } from 'express';
import ResponseUtil from '@/utils/response';
import logger from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';

export const errorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });

  // MongoDB duplicate key error (code 11000)
  if ('code' in err && err.code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    ResponseUtil.conflict(res, `${field} already exists`);
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationError = err as any;
    const errors = Object.values(validationError.errors).map((e: any) => e.message);
    ResponseUtil.badRequest(res, errors[0] || 'Validation failed');
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const castError = err as any;
    ResponseUtil.badRequest(res, `Invalid ${castError.path}: ${castError.value}`);
    return;
  }

  // Mongoose version error
  if (err.name === 'VersionError') {
    ResponseUtil.conflict(res, 'Document was modified by another user');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    ResponseUtil.unauthorized(res, 'Invalid token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    ResponseUtil.unauthorized(res, 'Token expired');
    return;
  }

  // Default error
  ResponseUtil.serverError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${req.method} ${req.path} not found`);
};

export default errorHandler;
