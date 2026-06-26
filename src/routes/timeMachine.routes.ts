import { Router, type Router as RouterType } from 'express';
import timeMachineController from '@/controllers/timeMachine.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router: RouterType = Router();

// All routes require authentication
router.use(authenticate);

// Scenario management
router.post('/scenarios', timeMachineController.createScenario);
router.post('/scenarios/:scenarioId/run', timeMachineController.runScenario);
router.get('/scenarios', timeMachineController.getUserScenarios);
router.get('/scenarios/:scenarioId', timeMachineController.getScenario);

// Predictions
router.get('/predict', timeMachineController.predictFuturePerformance);

// Alternative timelines
router.post('/alternative-timeline', timeMachineController.createAlternativeTimeline);

// Strategy comparison
router.post('/compare-strategies', timeMachineController.compareStrategies);

// Experiments
router.post('/experiments', timeMachineController.designExperiment);
router.get('/experiments', timeMachineController.getUserExperiments);

// Insights and analysis
router.get('/insights', timeMachineController.getTimeMachineInsights);
router.post('/what-if', timeMachineController.whatIfAnalysis);

export default router;
