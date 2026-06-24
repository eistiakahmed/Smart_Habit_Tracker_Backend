import { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
    };
    file?: Express.Multer.File;
    fileUploaded?: boolean;
  }
}

export {};