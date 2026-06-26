import { Router, type Router as RouterType } from 'express';
import energySchedulingController from '@/controllers/energyScheduling.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Energy logging
router.post('/log', energySchedulingController.logEnergy);
router.post('/log-from-habit/:habitId', energySchedulingController.logEnergyFromHabit);

// Energy data retrieval
router.get('/logs/today', energySchedulingController.getTodayEnergyLogs);
router.get('/patterns', energySchedulingController.getEnergyPatterns);
router.post('/analyze', energySchedulingController.analyzeEnergyPatterns);
router.get('/current', energySchedulingController.getCurrentEnergyLevel);

// Scheduling
router.post('/schedule-recommendations/:habitId', energySchedulingController.generateScheduleRecommendations);
router.get('/optimal-schedule', energySchedulingController.getOptimalSchedule);

// Energy goals
router.post('/goals', energySchedulingController.createEnergyGoal);
router.get('/goals', energySchedulingController.getEnergyGoals);

// Insights
router.get('/insights', energySchedulingController.getEnergyInsights);

export default router;
