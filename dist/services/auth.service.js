"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const password_1 = __importDefault(require("../utils/password"));
const jwt_1 = __importDefault(require("../utils/jwt"));
const logger_1 = __importDefault(require("../utils/logger"));
class AuthService {
    async register(data) {
        try {
            const existingUser = await User_1.default.findOne({
                $or: [{ email: data.email }, { username: data.username }],
            });
            if (existingUser) {
                if (existingUser.email === data.email) {
                    throw new Error('Email already registered');
                }
                if (existingUser.username === data.username) {
                    throw new Error('Username already taken');
                }
            }
            const passwordHash = await password_1.default.hash(data.password);
            const user = await User_1.default.create({
                email: data.email,
                username: data.username,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                timezone: 'UTC',
            });
            const tokens = jwt_1.default.generateTokenPair({
                userId: user._id.toString(),
                email: user.email,
                username: user.username,
            });
            await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, tokens.expiresIn);
            logger_1.default.info(`New user registered: ${user._id}`);
            return {
                user: this.sanitizeUser(user),
                tokens,
            };
        }
        catch (error) {
            logger_1.default.error('Registration error:', error);
            throw error;
        }
    }
    async login(data) {
        try {
            const user = await User_1.default.findOne({ email: data.email });
            if (!user) {
                throw new Error('Invalid credentials');
            }
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }
            const isValidPassword = await password_1.default.compare(data.password, user.passwordHash);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }
            const tokens = jwt_1.default.generateTokenPair({
                userId: user._id.toString(),
                email: user.email,
                username: user.username,
            });
            await this.storeRefreshToken(user._id.toString(), tokens.refreshToken, tokens.expiresIn);
            user.updatedAt = new Date();
            await user.save();
            logger_1.default.info(`User logged in: ${user._id}`);
            return {
                user: this.sanitizeUser(user),
                tokens,
            };
        }
        catch (error) {
            logger_1.default.error('Login error:', error);
            throw error;
        }
    }
    async logout(userId, refreshToken) {
        try {
            await Session_1.default.deleteOne({
                userId: new mongoose_1.Types.ObjectId(userId),
                refreshToken,
            });
            logger_1.default.info(`User logged out: ${userId}`);
        }
        catch (error) {
            logger_1.default.error('Logout error:', error);
            throw error;
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            const payload = jwt_1.default.verifyRefreshToken(refreshToken);
            const session = await Session_1.default.findOne({
                refreshToken,
            }).populate('userId');
            if (!session || session.userId.toString() !== payload.userId) {
                throw new Error('Invalid refresh token');
            }
            if (session.expiresAt < new Date()) {
                await Session_1.default.deleteOne({ _id: session._id });
                throw new Error('Refresh token expired');
            }
            const user = await User_1.default.findById(payload.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }
            const accessToken = jwt_1.default.generateAccessToken({
                userId: user._id.toString(),
                email: user.email,
                username: user.username,
            });
            const expiresIn = jwt_1.default.getTokenExpiration('15m');
            return { accessToken, expiresIn };
        }
        catch (error) {
            logger_1.default.error('Refresh token error:', error);
            throw error;
        }
    }
    async getMe(userId) {
        try {
            const user = await User_1.default.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            return this.sanitizeUser(user);
        }
        catch (error) {
            logger_1.default.error('Get user error:', error);
            throw error;
        }
    }
    async updateProfile(userId, data) {
        try {
            const user = await User_1.default.findByIdAndUpdate(userId, { $set: data }, { new: true, runValidators: true });
            if (!user) {
                throw new Error('User not found');
            }
            return this.sanitizeUser(user);
        }
        catch (error) {
            logger_1.default.error('Update profile error:', error);
            throw error;
        }
    }
    async storeRefreshToken(userId, refreshToken, expiresIn) {
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        await Session_1.default.create({
            userId: new mongoose_1.Types.ObjectId(userId),
            refreshToken,
            expiresAt,
        });
    }
    sanitizeUser(user) {
        return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            preferences: user.preferences || {},
            createdAt: user.createdAt,
        };
    }
    async cleanupExpiredSessions() {
        try {
            await Session_1.default.deleteMany({
                expiresAt: { $lt: new Date() },
            });
            logger_1.default.info('Expired sessions cleaned up');
        }
        catch (error) {
            logger_1.default.error('Cleanup sessions error:', error);
        }
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map