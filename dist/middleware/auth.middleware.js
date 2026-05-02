"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const jwt_1 = __importDefault(require("@/utils/jwt"));
const response_1 = __importDefault(require("@/utils/response"));
const logger_1 = __importDefault(require("@/utils/logger"));
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            response_1.default.unauthorized(res, 'No token provided');
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            response_1.default.unauthorized(res, 'No token provided');
            return;
        }
        const decoded = jwt_1.default.verifyAccessToken(token);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            username: decoded.username || '',
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error:', error);
        response_1.default.unauthorized(res, error.message || 'Invalid or expired token');
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = jwt_1.default.verifyAccessToken(token);
                    req.user = {
                        id: decoded.userId,
                        email: decoded.email,
                        username: decoded.username || '',
                    };
                }
                catch (error) {
                }
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
exports.default = { authenticate: exports.authenticate, optionalAuth: exports.optionalAuth };
//# sourceMappingURL=auth.middleware.js.map