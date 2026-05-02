import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const validate: (schema: ZodSchema, property?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export default validate;
//# sourceMappingURL=validation.middleware.d.ts.map