// PPE Request Schema for Mobile
import { z } from "zod";

export const ppeRequestSchema = z.object({
  itemId: z.string().uuid("Item inválido").min(1, "Selecione um item"),
  quantity: z.coerce.number().int().positive().default(1),
  reason: z.string().min(1, "Justificativa é obrigatória"),
  scheduledDate: z.date().nullable().optional(),
});

export type PpeRequestFormData = z.infer<typeof ppeRequestSchema>;
