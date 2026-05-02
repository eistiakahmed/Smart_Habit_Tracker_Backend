"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateRangeSchema = exports.paginationSchema = exports.idParamSchema = void 0;
const zod_1 = require("zod");
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().cuid('Invalid ID format'),
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: zod_1.z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=common.validator.js.map