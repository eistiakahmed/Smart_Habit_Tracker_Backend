import { AuthResponse, CreateUserData, LoginData } from '@/types';
declare class AuthService {
    register(data: CreateUserData): Promise<AuthResponse>;
    login(data: LoginData): Promise<AuthResponse>;
    logout(userId: string, refreshToken: string): Promise<void>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    getMe(userId: string): Promise<any>;
    updateProfile(userId: string, data: any): Promise<any>;
    private storeRefreshToken;
    private sanitizeUser;
    cleanupExpiredSessions(): Promise<void>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=auth.service.d.ts.map