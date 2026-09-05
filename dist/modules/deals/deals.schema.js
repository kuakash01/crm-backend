"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignDealsSchema = void 0;
const zod_1 = require("zod");
exports.assignDealsSchema = zod_1.z.object({
    dealIds: zod_1.z
        .array(zod_1.z.number())
        .min(1),
    assignedTo: zod_1.z.number(),
});
