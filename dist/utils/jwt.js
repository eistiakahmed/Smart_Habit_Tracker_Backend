"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtUtil = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../config/app"));
class JwtUtil {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload, type: 'access' }, app_1.default.jwt.secret, { expiresIn: app_1.default.jwt.expiresIn });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, app_1.default.jwt.refreshTokenSecret, { expiresIn: app_1.default.jwt.refreshTokenExpiresIn });
    }
    static generateTokenPair(payload) {
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken(payload);
        const expiresIn = this.getTokenExpiration(app_1.default.jwt.expiresIn);
        return { accessToken, refreshToken, expiresIn };
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, app_1.default.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, app_1.default.jwt.refreshTokenSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    static getTokenExpiration(expiresIn) {
        const timeMatch = expiresIn.match(/^(\d+)([smhd])$/);
        if (!timeMatch) {
            return 900;
        }
        const value = parseInt(timeMatch[1], 10);
        const unit = timeMatch[2];
        const multipliers = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
        };
        return value * multipliers[unit];
    }
    static isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) {
                return true;
            }
            return Date.now() >= decoded.exp * 1000;
        }
        catch (error) {
            return true;
        }
    }
}
exports.JwtUtil = JwtUtil;
exports.default = JwtUtil;
//# sourceMappingURL=jwt.js.map