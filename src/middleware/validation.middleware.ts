import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import ResponseUtil from '@/utils/response';
import logger from '@/utils/logger';

export const validate =
  (schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = await schema.parseAsync(req[property]);
      req[property] = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);

        logger.info('Validation error:', errors);
        ResponseUtil.validationError(res, errors);
        return;
      }

      logger.error('Unexpected validation error:', error);
      ResponseUtil.serverError(res, 'Validation failed');
    }
  };

export default validate;
