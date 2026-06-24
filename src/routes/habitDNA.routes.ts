import { Router } from 'express';
import habitDNAController from '@/controllers/habitDNA.controller';
import { authenticate } from '@/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Analyze habit genetics
router.get('/analyze/:habitId', habitDNAController.analyzeHabitGenetics);

// Breed two habits
router.post('/breed', habitDNAController.breedHabits);

// Get breeding suggestions for a habit
router.get('/breeding-suggestions/:habitId', habitDNAController.getBreedingSuggestions);

// Mutate a habit
router.post('/mutate/:habitId', habitDNAController.mutateHabit);

// Get genetic insights for a habit
router.get('/insights/:habitId', habitDNAController.getGeneticInsights);

// Get all user's habit DNAs
router.get('/my-dnas', habitDNAController.getUserHabitDNA);

export default router;
