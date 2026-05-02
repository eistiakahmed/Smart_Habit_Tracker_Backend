import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map