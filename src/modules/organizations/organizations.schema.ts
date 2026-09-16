import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(255)
    .optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(255)
    .optional()
    .or(z.literal("")),
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

export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationSchema
>;
