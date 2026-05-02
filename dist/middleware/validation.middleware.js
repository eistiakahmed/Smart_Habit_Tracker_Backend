"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_1 = __importDefault(require("@/utils/response"));
const logger_1 = __importDefault(require("@/utils/logger"));
const validate = (schema, property = 'body') => async (req, res, next) => {
    try {
        const validatedData = await schema.parseAsync(req[property]);
        req[property] = validatedData;
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const errors = error.errors.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
            }, {});
            logger_1.default.info('Validation error:', errors);
            response_1.default.validationError(res, errors);
            return;
        }
        logger_1.default.error('Unexpected validation error:', error);
        response_1.default.serverError(res, 'Validation failed');
    }
};
exports.validate = validate;
exports.default = exports.validate;
//# sourceMappingURL=validation.middleware.js.map