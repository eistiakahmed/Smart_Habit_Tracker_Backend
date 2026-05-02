import { Response } from 'express';
import { ApiResponse, ApiError } from '@/types';

export class ResponseUtil {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      ...(message && { message }),
      ...(data !== undefined && { data }),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    error: string | ApiError,
    statusCode: number = 500,
    message?: string
  ): Response {
    const apiError: ApiError =
      typeof error === 'string'
        ? { code: this.getErrorCode(statusCode), message: error }
        : error;

    const response: ApiResponse = {
      success: false,
      message: message || 'An error occurred',
      error: apiError,
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(res: Response, message: string = 'Bad request', details?: Record<string, any>): Response {
    return this.error(res, {
      code: 'BAD_REQUEST',
      message,
      details,
    }, 400);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, {
      code: 'UNAUTHORIZED',
      message,
    }, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, {
      code: 'FORBIDDEN',
      message,
    }, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, {
      code: 'NOT_FOUND',
      message,
    }, 404);
  }

  static conflict(res: Response, message: string = 'Resource already exists'): Response {
    return this.error(res, {
      code: 'CONFLICT',
      message,
    }, 409);
  }

  static validationError(res: Response, details: Record<string, any>): Response {
    return this.badRequest(res, 'Validation failed', details);
  }

  static serverError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, {
      code: 'INTERNAL_SERVER_ERROR',
      message,
    }, 500);
  }

  private static getErrorCode(statusCode: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return errorCodes[statusCode] || 'UNKNOWN_ERROR';
  }
}

export default ResponseUtil;
