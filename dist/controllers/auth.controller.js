"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("@/services/auth.service"));
const logger_1 = __importDefault(require("@/utils/logger"));
const response_1 = __importDefault(require("@/utils/response"));
class AuthController {
    async register(req, res) {
        try {
            const result = await auth_service_1.default.register(req.body);
            response_1.default.created(res, result, 'User registered successfully');
        }
        catch (error) {
            logger_1.default.error('Register controller error:', error);
            if (error.message.includes('already')) {
                response_1.default.conflict(res, error.message);
                return;
            }
            response_1.default.badRequest(res, error.message);
        }
    }
    async login(req, res) {
        try {
            const result = await auth_service_1.default.login(req.body);
            response_1.default.success(res, result, 'Login successful');
        }
        catch (error) {
            logger_1.default.error('Login controller error:', error);
            response_1.default.unauthorized(res, error.message || 'Invalid credentials');
        }
    }
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            await auth_service_1.default.logout(req.user.id, refreshToken);
            response_1.default.success(res, null, 'Logged out successfully');
        }
        catch (error) {
            logger_1.default.error('Logout controller error:', error);
            response_1.default.serverError(res, 'Logout failed');
        }
    }
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await auth_service_1.default.refreshAccessToken(refreshToken);
            response_1.default.success(res, result, 'Token refreshed successfully');
        }
        catch (error) {
            logger_1.default.error('Refresh token controller error:', error);
            response_1.default.unauthorized(res, error.message || 'Invalid refresh token');
        }
    }
    async getMe(req, res) {
        try {
            const user = await auth_service_1.default.getMe(req.user.id);
            response_1.default.success(res, user);
        }
        catch (error) {
            logger_1.default.error('Get me controller error:', error);
            response_1.default.notFound(res, error.message);
        }
    }
    async updateProfile(req, res) {
        try {
            const user = await auth_service_1.default.updateProfile(req.user.id, req.body);
            response_1.default.success(res, user, 'Profile updated successfully');
        }
        catch (error) {
            logger_1.default.error('Update profile controller error:', error);
            response_1.default.serverError(res, 'Update failed');
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map