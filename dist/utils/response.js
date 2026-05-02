"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseUtil = void 0;
class ResponseUtil {
    static success(res, data, message, statusCode = 200) {
        const response = {
            success: true,
            ...(message && { message }),
            ...(data !== undefined && { data }),
        };
        return res.status(statusCode).json(response);
    }
    static error(res, error, statusCode = 500, message) {
        const apiError = typeof error === 'string'
            ? { code: this.getErrorCode(statusCode), message: error }
            : error;
        const response = {
            success: false,
            message: message || 'An error occurred',
            error: apiError,
        };
        return res.status(statusCode).json(response);
    }
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static badRequest(res, message = 'Bad request', details) {
        return this.error(res, {
            code: 'BAD_REQUEST',
            message,
            details,
        }, 400);
    }
    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, {
            code: 'UNAUTHORIZED',
            message,
        }, 401);
    }
    static forbidden(res, message = 'Forbidden') {
        return this.error(res, {
            code: 'FORBIDDEN',
            message,
        }, 403);
    }
    static notFound(res, message = 'Resource not found') {
        return this.error(res, {
            code: 'NOT_FOUND',
            message,
        }, 404);
    }
    static conflict(res, message = 'Resource already exists') {
        return this.error(res, {
            code: 'CONFLICT',
            message,
        }, 409);
    }
    static validationError(res, details) {
        return this.badRequest(res, 'Validation failed', details);
    }
    static serverError(res, message = 'Internal server error') {
        return this.error(res, {
            code: 'INTERNAL_SERVER_ERROR',
            message,
        }, 500);
    }
    static getErrorCode(statusCode) {
        const errorCodes = {
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
exports.ResponseUtil = ResponseUtil;
exports.default = ResponseUtil;
//# sourceMappingURL=response.js.map