import { z } from "zod";

export const inboundLeadSchema = z.object({
  fname: z
    .string()
    .min(1, "First name is required")
    .max(100)
    .regex(/^[A-Za-z\s'\-\.]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lname: z
    .string()
    .min(1, "Last name is required")
    .max(100)
    .regex(/^[A-Za-z\s'\-\.]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(100),
  phone1: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Phone number must be between 7 and 20 valid phone characters"),
  phone2: z
    .string()
    .regex(/^\+?[0-9\s\-()]{7,20}$/, "Secondary phone must be between 7 and 20 valid phone characters")
    .optional()
    .or(z.literal("")),
  company: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal("")),
  // Secure publishable token for multi-tenant organizations (never expose raw numeric org IDs)
  key: z
    .string()
    .min(10)
    .max(64)
    .optional(),
  // Anti-bot Honeypot trap: Humans leave this empty; bots auto-fill it
  website_url: z
    .string()
    .max(200)
    .optional(),
});

export type InboundLeadInput = z.infer<typeof inboundLeadSchema>;
