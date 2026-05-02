import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const errorHandler: (err: Error, req: AuthenticatedRequest, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export default errorHandler;
//# sourceMappingURL=error.middleware.d.ts.map