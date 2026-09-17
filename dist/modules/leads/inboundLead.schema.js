"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inboundLeadSchema = void 0;
const zod_1 = require("zod");
exports.inboundLeadSchema = zod_1.z.object({
    fname: zod_1.z
        .string()
        .min(1, "First name is required")
        .max(100)
        .regex(/^[A-Za-z\s'\-\.]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
    lname: zod_1.z
        .string()
        .min(1, "Last name is required")
        .max(100)
        .regex(/^[A-Za-z\s'\-\.]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .max(100),
    phone1: zod_1.z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,20}$/, "Phone number must be between 7 and 20 valid phone characters"),
    phone2: zod_1.z
        .string()
        .regex(/^\+?[0-9\s\-()]{7,20}$/, "Secondary phone must be between 7 and 20 valid phone characters")
        .optional()
        .or(zod_1.z.literal("")),
    company: zod_1.z
        .string()
        .max(100)
        .optional()
        .or(zod_1.z.literal("")),
    message: zod_1.z
        .string()
        .max(2000)
        .optional()
        .or(zod_1.z.literal("")),
    // Secure publishable token for multi-tenant organizations (never expose raw numeric org IDs)
    key: zod_1.z
        .string()
        .min(10)
        .max(64)
        .optional(),
    // Anti-bot Honeypot trap: Humans leave this empty; bots auto-fill it
    website_url: zod_1.z
        .string()
        .max(200)
        .optional(),
});
