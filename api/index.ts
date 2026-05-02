import { createApp } from '../src/app';
import { connectDB } from '../src/config/database';

// Cache the app instance
let app: any;

async function getApp() {
  if (!app) {
    await connectDB();
    app = createApp();
  }
  return app;
}

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
