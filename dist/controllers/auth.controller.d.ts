import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class AuthController {
    register(req: AuthenticatedRequest, res: Response): Promise<void>;
    login(req: AuthenticatedRequest, res: Response): Promise<void>;
    logout(req: AuthenticatedRequest, res: Response): Promise<void>;
    refresh(req: AuthenticatedRequest, res: Response): Promise<void>;
    getMe(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map