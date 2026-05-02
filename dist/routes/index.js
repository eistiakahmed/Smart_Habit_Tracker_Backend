"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const habit_routes_1 = __importDefault(require("./habit.routes"));
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
exports.default = router;
//# sourceMappingURL=index.js.map