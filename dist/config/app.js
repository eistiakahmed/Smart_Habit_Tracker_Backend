"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: '/api/v1',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    },
    database: {
        url: process.env.DATABASE_URL || '',
    },
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),
    },
    pagination: {
        defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
        maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
    },
    email: {
        enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.EMAIL_FROM || 'noreply@smarthabits.com',
    },
    features: {
        enableSwagger: process.env.ENABLE_SWAGGER === 'true',
        enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        enableAchievements: process.env.ENABLE_ACHIEVEMENTS !== 'false',
    },
};
exports.default = exports.config;
//# sourceMappingURL=app.js.map