export declare const config: {
    port: number;
    nodeEnv: string;
    apiVersion: string;
    jwt: {
        secret: string;
        expiresIn: string;
        refreshTokenSecret: string;
        refreshTokenExpiresIn: string;
    };
    database: {
        url: string;
    };
    cors: {
        origin: string;
        credentials: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        authMaxRequests: number;
    };
    pagination: {
        defaultPageSize: number;
        maxPageSize: number;
    };
    email: {
        enabled: boolean;
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
    };
    features: {
        enableSwagger: boolean;
        enableEmailNotifications: boolean;
        enableAchievements: boolean;
    };
};
export default config;
//# sourceMappingURL=app.d.ts.map