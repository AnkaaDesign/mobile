// PPE Request Schema for Mobile
import { z } from "zod";

export const ppeRequestSchema = z.object({
  itemId: z.string().uuid("Item inválido").min(1, "Selecione um item"),
  quantity: z.coerce.number().int("Quantidade deve ser um número inteiro").positive("Quantidade deve ser positiva").min(1, "Quantidade mínima é 1"),
  scheduledDate: z.date().nullable().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export type PpeRequestFormData = z.infer<typeof ppeRequestSchema>;
