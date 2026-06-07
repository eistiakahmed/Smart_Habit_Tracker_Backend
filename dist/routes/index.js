"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const habit_routes_1 = __importDefault(require("./habit.routes"));
const goal_routes_1 = __importDefault(require("./goal.routes"));
const gamification_routes_1 = __importDefault(require("./gamification.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const social_routes_1 = __importDefault(require("./social.routes"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Smart Habit Tracker API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
router.use('/auth', auth_routes_1.default);
router.use('/habits', habit_routes_1.default);
router.use('/goals', goal_routes_1.default);
router.use('/gamification', gamification_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
router.use('/social', social_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map