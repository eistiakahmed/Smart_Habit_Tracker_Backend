"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const habit_controller_1 = __importDefault(require("@/controllers/habit.controller"));
const auth_middleware_1 = require("@/middleware/auth.middleware");
const validation_middleware_1 = __importDefault(require("@/middleware/validation.middleware"));
const habit_validator_1 = require("@/validators/habit.validator");
const common_validator_1 = require("@/validators/common.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', habit_controller_1.default.getAllHabits);
router.post('/', (0, validation_middleware_1.default)(habit_validator_1.createHabitSchema), habit_controller_1.default.createHabit);
router.get('/:id', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), habit_controller_1.default.getHabitById);
router.put('/:id', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), (0, validation_middleware_1.default)(habit_validator_1.updateHabitSchema), habit_controller_1.default.updateHabit);
router.delete('/:id', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), habit_controller_1.default.deleteHabit);
router.post('/:id/toggle', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), (0, validation_middleware_1.default)(habit_validator_1.toggleHabitSchema), habit_controller_1.default.toggleHabit);
router.get('/:id/progress', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), habit_controller_1.default.getHabitProgress);
router.get('/:id/streak', (0, validation_middleware_1.default)(common_validator_1.idParamSchema, 'params'), habit_controller_1.default.getHabitStreak);
exports.default = router;
//# sourceMappingURL=habit.routes.js.map