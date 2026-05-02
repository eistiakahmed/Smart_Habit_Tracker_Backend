import { Router } from 'express';
import authRoutes from './auth.routes';
import habitRoutes from './habit.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Smart Habit Tracker API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/habits', habitRoutes);

export default router;
