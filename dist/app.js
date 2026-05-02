"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const app_1 = __importDefault(require("@/config/app"));
const routes_1 = __importDefault(require("@/routes"));
const rateLimit_middleware_1 = require("@/middleware/rateLimit.middleware");
const error_middleware_1 = require("@/middleware/error.middleware");
const logger_middleware_1 = __importDefault(require("@/middleware/logger.middleware"));
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: app_1.default.cors.origin,
        credentials: app_1.default.cors.credentials,
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use((0, compression_1.default)());
    if (app_1.default.nodeEnv === 'development') {
        app.use((0, morgan_1.default)('dev'));
    }
    app.use(logger_middleware_1.default);
    app.use('/api', rateLimit_middleware_1.generalLimiter);
    app.use('/api/v1', routes_1.default);
    app.get('/', (_req, res) => {
        res.json({
            success: true,
            message: 'Welcome to Smart Habit Tracker API',
            version: '1.0.0',
            documentation: '/api/v1/docs',
        });
    });
    app.use(error_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map