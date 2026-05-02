import { JwtPayload } from '../types';
export declare class JwtUtil {
    static generateAccessToken(payload: Omit<JwtPayload, 'type' | 'exp'>): string;
    static generateRefreshToken(payload: Omit<JwtPayload, 'type' | 'exp'>): string;
    static generateTokenPair(payload: Omit<JwtPayload, 'type'>): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
    static verifyAccessToken(token: string): JwtPayload;
    static verifyRefreshToken(token: string): JwtPayload;
    static decodeToken(token: string): JwtPayload | null;
    static getTokenExpiration(expiresIn: string): number;
    static isTokenExpired(token: string): boolean;
}
export default JwtUtil;
//# sourceMappingURL=jwt.d.ts.map