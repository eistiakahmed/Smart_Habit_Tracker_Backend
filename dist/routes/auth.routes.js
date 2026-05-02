"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("@/controllers/auth.controller"));
const auth_middleware_1 = require("@/middleware/auth.middleware");
const rateLimit_middleware_1 = require("@/middleware/rateLimit.middleware");
const validation_middleware_1 = __importDefault(require("@/middleware/validation.middleware"));
const auth_validator_1 = require("@/validators/auth.validator");
const router = (0, express_1.Router)();
router.post('/register', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.default)(auth_validator_1.registerSchema), auth_controller_1.default.register);
router.post('/login', rateLimit_middleware_1.authLimiter, (0, validation_middleware_1.default)(auth_validator_1.loginSchema), auth_controller_1.default.login);
router.post('/logout', auth_middleware_1.authenticate, (0, validation_middleware_1.default)(auth_validator_1.refreshTokenSchema), auth_controller_1.default.logout);
router.post('/refresh', (0, validation_middleware_1.default)(auth_validator_1.refreshTokenSchema), auth_controller_1.default.refresh);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.default.getMe);
router.put('/profile', auth_middleware_1.authenticate, (0, validation_middleware_1.default)(auth_validator_1.updateProfileSchema), auth_controller_1.default.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map