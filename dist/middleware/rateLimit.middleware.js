"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.generalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const app_1 = __importDefault(require("@/config/app"));
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: app_1.default.rateLimit.windowMs,
    max: app_1.default.rateLimit.maxRequests,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: app_1.default.rateLimit.windowMs,
    max: app_1.default.rateLimit.authMaxRequests,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.default = { generalLimiter: exports.generalLimiter, authLimiter: exports.authLimiter };
//# sourceMappingURL=rateLimit.middleware.js.map