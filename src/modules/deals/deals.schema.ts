import { z } from "zod";

export const assignDealsSchema = z.object({
  dealIds: z
    .array(z.number())
    .min(1),

  assignedTo: z.number(),
});