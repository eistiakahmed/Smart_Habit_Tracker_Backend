import { Response } from 'express';
import { ApiError } from '../types';
export declare class ResponseUtil {
    static success<T>(res: Response, data?: T, message?: string, statusCode?: number): Response;
    static error(res: Response, error: string | ApiError, statusCode?: number, message?: string): Response;
    static created<T>(res: Response, data: T, message?: string): Response;
    static noContent(res: Response): Response;
    static badRequest(res: Response, message?: string, details?: Record<string, any>): Response;
    static unauthorized(res: Response, message?: string): Response;
    static forbidden(res: Response, message?: string): Response;
    static notFound(res: Response, message?: string): Response;
    static conflict(res: Response, message?: string): Response;
    static validationError(res: Response, details: Record<string, any>): Response;
    static serverError(res: Response, message?: string): Response;
    private static getErrorCode;
}
export default ResponseUtil;
//# sourceMappingURL=response.d.ts.map