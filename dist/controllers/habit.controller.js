"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const habit_service_1 = __importDefault(require("../services/habit.service"));
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = __importDefault(require("../utils/response"));
class HabitController {
    async getAllHabits(req, res) {
        try {
            const filter = {
                category: req.query.category,
                isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            };
            const result = await habit_service_1.default.getAllHabits(req.user.id, filter);
            response_1.default.success(res, result);
        }
        catch (error) {
            logger_1.default.error('Get habits controller error:', error);
            response_1.default.serverError(res, 'Failed to fetch habits');
        }
    }
    async getHabitById(req, res) {
        try {
            const habit = await habit_service_1.default.getHabitById(req.params.id, req.user.id);
            response_1.default.success(res, { habit });
        }
        catch (error) {
            logger_1.default.error('Get habit controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to fetch habit');
        }
    }
    async createHabit(req, res) {
        try {
            const habit = await habit_service_1.default.createHabit(req.user.id, req.body);
            response_1.default.created(res, { habit }, 'Habit created successfully');
        }
        catch (error) {
            logger_1.default.error('Create habit controller error:', error);
            if (error.message.includes('limit reached')) {
                response_1.default.badRequest(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to create habit');
        }
    }
    async updateHabit(req, res) {
        try {
            const habit = await habit_service_1.default.updateHabit(req.params.id, req.user.id, req.body);
            response_1.default.success(res, { habit }, 'Habit updated successfully');
        }
        catch (error) {
            logger_1.default.error('Update habit controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to update habit');
        }
    }
    async deleteHabit(req, res) {
        try {
            await habit_service_1.default.deleteHabit(req.params.id, req.user.id);
            response_1.default.success(res, null, 'Habit deleted successfully');
        }
        catch (error) {
            logger_1.default.error('Delete habit controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to delete habit');
        }
    }
    async toggleHabit(req, res) {
        try {
            const result = await habit_service_1.default.toggleHabit(req.params.id, req.user.id, req.body);
            if (result.todayCompleted) {
                response_1.default.success(res, result, 'Habit marked as completed');
            }
            else {
                response_1.default.success(res, result, 'Habit marked as incomplete');
            }
        }
        catch (error) {
            logger_1.default.error('Toggle habit controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            if (error.message === 'Habit is not active') {
                response_1.default.badRequest(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to toggle habit');
        }
    }
    async getHabitProgress(req, res) {
        try {
            const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
            const progress = await habit_service_1.default.getHabitProgress(req.params.id, req.user.id, startDate, endDate);
            response_1.default.success(res, progress);
        }
        catch (error) {
            logger_1.default.error('Get habit progress controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to fetch habit progress');
        }
    }
    async getHabitStreak(req, res) {
        try {
            const streak = await habit_service_1.default.getHabitStreak(req.params.id, req.user.id);
            response_1.default.success(res, streak);
        }
        catch (error) {
            logger_1.default.error('Get habit streak controller error:', error);
            if (error.message === 'Habit not found') {
                response_1.default.notFound(res, error.message);
                return;
            }
            response_1.default.serverError(res, 'Failed to fetch habit streak');
        }
    }
}
exports.default = new HabitController();
//# sourceMappingURL=habit.controller.js.map