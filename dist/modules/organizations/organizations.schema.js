"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrganizationSchema = void 0;
const zod_1 = require("zod");
const optionalText = (max) => zod_1.z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(zod_1.z.literal(""));
exports.updateOrganizationSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Company name must be at least 2 characters")
        .max(255)
        .optional(),
    email: zod_1.z
        .string()
        .trim()
        .email("Enter a valid email")
        .max(255)
        .optional()
        .or(zod_1.z.literal("")),
    phone: optionalText(30),
    website: optionalText(255),
    address: optionalText(500),
    city: optionalText(100),
    state: optionalText(100),
    country: optionalText(100),
    zipCode: optionalText(20),
    industry: optionalText(100),
    description: optionalText(2000),
    logo: optionalText(500),
});
