import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class HabitController {
    getAllHabits(req: AuthenticatedRequest, res: Response): Promise<void>;
    getHabitById(req: AuthenticatedRequest, res: Response): Promise<void>;
    createHabit(req: AuthenticatedRequest, res: Response): Promise<void>;
    updateHabit(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteHabit(req: AuthenticatedRequest, res: Response): Promise<void>;
    toggleHabit(req: AuthenticatedRequest, res: Response): Promise<void>;
    getHabitProgress(req: AuthenticatedRequest, res: Response): Promise<void>;
    getHabitStreak(req: AuthenticatedRequest, res: Response): Promise<void>;
}
declare const _default: HabitController;
export default _default;
//# sourceMappingURL=habit.controller.d.ts.map