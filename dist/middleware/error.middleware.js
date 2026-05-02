"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const response_1 = __importDefault(require("../utils/response"));
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, _next) => {
    logger_1.default.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
    });
    if ('code' in err && err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        response_1.default.conflict(res, `${field} already exists`);
        return;
    }
    if (err.name === 'ValidationError') {
        const validationError = err;
        const errors = Object.values(validationError.errors).map((e) => e.message);
        response_1.default.badRequest(res, errors[0] || 'Validation failed');
        return;
    }
    if (err.name === 'CastError') {
        const castError = err;
        response_1.default.badRequest(res, `Invalid ${castError.path}: ${castError.value}`);
        return;
    }
    if (err.name === 'VersionError') {
        response_1.default.conflict(res, 'Document was modified by another user');
        return;
    }
    if (err.name === 'JsonWebTokenError') {
        response_1.default.unauthorized(res, 'Invalid token');
        return;
    }
    if (err.name === 'TokenExpiredError') {
        response_1.default.unauthorized(res, 'Token expired');
        return;
    }
    response_1.default.serverError(res, process.env.NODE_ENV === 'development' ? err.message : 'Internal server error');
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    response_1.default.notFound(res, `Route ${req.method} ${req.path} not found`);
};
exports.notFoundHandler = notFoundHandler;
exports.default = exports.errorHandler;
//# sourceMappingURL=error.middleware.js.map