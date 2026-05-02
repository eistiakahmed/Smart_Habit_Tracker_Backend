import { Router } from 'express';
import authRoutes from './auth.routes';
import habitRoutes from './habit.routes';
import goalRoutes from './goal.routes';
import gamificationRoutes from './gamification.routes';
import analyticsRoutes from './analytics.routes';
import socialRoutes from './social.routes';

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
router.use('/goals', goalRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/social', socialRoutes);

export default router;
