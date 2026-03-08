import { z } from 'zod';

/**
 * Preprocess money values that might come as formatted strings (e.g., "R$ 6.230,00")
 * or as numbers. Converts them to a numeric value.
 */
const preprocessMoney = (val: unknown): number | null | undefined => {
  if (val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    // Remove currency symbol and whitespace
    let cleaned = val.replace(/R\$\s*/g, '').trim();
    // Handle Brazilian format: "6.230,00" -> "6230.00"
    // First remove thousands separators (dots), then convert decimal comma to dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
};

export const taskPricingStatusSchema = z.enum([
  'PENDING',
  'BUDGET_APPROVED',
  'VERIFIED',
  'INTERNAL_APPROVED',
  'UPCOMING',
  'PARTIAL',
  'SETTLED',
]);

export const discountTypeSchema = z.enum([
  'NONE',
  'PERCENTAGE',
  'FIXED_VALUE',
]);

export const paymentConditionSchema = z.enum([
  'CASH',
  'INSTALLMENTS_2',
  'INSTALLMENTS_3',
  'INSTALLMENTS_4',
  'INSTALLMENTS_5',
  'INSTALLMENTS_6',
  'INSTALLMENTS_7',
  'CUSTOM',
]);

export const guaranteeYearsSchema = z.number().refine(
  (val) => [5, 10, 15].includes(val),
  { message: 'Período de garantia inválido' }
);

export const taskPricingServiceSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição é obrigatória').max(400),
  observation: z.string().max(2000).optional().nullable(),
  amount: z.number().min(0, 'Valor deve ser maior ou igual a zero'),
  shouldSync: z.boolean().optional().default(true),
  invoiceToCustomerId: z.string().uuid('Cliente inválido').optional().nullable(),
});

// Lenient service schema for nested creation (allows incomplete services during editing)
const taskPricingServiceCreateSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().optional().default(''),
  observation: z.string().max(2000).optional().nullable(),
  // Amount might come as formatted currency string (e.g., "R$ 520,00")
  amount: z.preprocess(preprocessMoney, z.number().optional().nullable()),
  shouldSync: z.boolean().optional().default(true), // Controls bidirectional sync with ServiceOrder
  invoiceToCustomerId: z.string().uuid('Cliente inválido').optional().nullable(),
});

// Preprocess services array to filter out empty placeholder services
const taskPricingServicesArraySchema = z.preprocess(
  (val) => {
    // Filter out empty pricing services (those without descriptions)
    if (Array.isArray(val)) {
      return val.filter((service: any) => service && service.description && service.description.trim() !== '');
    }
    return val;
  },
  z.array(taskPricingServiceCreateSchema).optional().default([])
);

// Customer config schema for per-customer billing
export const taskPricingCustomerConfigSchema = z.object({
  customerId: z.string().uuid('Cliente inválido'),
  subtotal: z.preprocess(preprocessMoney, z.number().optional().nullable().default(0)),
  discountType: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? 'NONE' : String(val)),
    discountTypeSchema.default('NONE')
  ),
  discountValue: z.preprocess(preprocessMoney, z.number().optional().nullable()),
  total: z.preprocess(preprocessMoney, z.number().optional().nullable().default(0)),
  paymentCondition: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : String(val)),
    paymentConditionSchema.optional().nullable()
  ),
  downPaymentDate: z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? null : val),
    z.coerce.date().nullable()
  ).optional(),
  customPaymentText: z.string().max(2000).optional().nullable(),
  responsibleId: z.string().uuid().optional().nullable(),
  discountReference: z.string().max(500).optional().nullable(),
  customerSignatureId: z.string().uuid().optional().nullable(),
  installments: z.array(z.object({
    id: z.string().uuid().optional(),
    number: z.number().int(),
    dueDate: z.coerce.date(),
    amount: z.number(),
  })).optional(),
});

// Schema that allows optional pricing or validates pricing when services exist
export const taskPricingCreateNestedSchema = z
  .object({
    expiresAt: z.coerce.date().optional().nullable(),
    status: taskPricingStatusSchema.optional().default('PENDING'),
    services: taskPricingServicesArraySchema, // Uses preprocessing to filter empty services
    // These fields might come as formatted currency strings (e.g., "R$ 6.230,00")
    // from the form, so we preprocess them to convert to numbers
    subtotal: z.preprocess(preprocessMoney, z.number().optional().nullable()),
    total: z.preprocess(preprocessMoney, z.number().optional().nullable()),
    // Guarantee Terms
    guaranteeYears: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? null : Number(val),
      z.number().optional().nullable()
    ),
    customGuaranteeText: z.string().max(2000).optional().nullable(),
    // Custom Forecast - manual override for production days displayed in budget (1-30 days)
    customForecastDays: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? null : Number(val),
      z.number().int().min(1).max(30).optional().nullable()
    ),
    // Layout File
    layoutFileId: z.string().uuid().optional().nullable(),
    // Customer configs for per-customer billing (at least 1 required)
    customerConfigs: z.array(taskPricingCustomerConfigSchema).min(1, 'Pelo menos uma configuração de cliente é obrigatória'),
    // Advanced pricing features
    simultaneousTasks: z.preprocess(
      (val) => val === '' || val === null || val === undefined ? null : Number(val),
      z.number().int().min(1).max(100).optional().nullable()
    ),
  })
  .optional()
  .superRefine((data, ctx) => {
    // If no data or no services, it's valid (optional pricing)
    if (!data || !data.services || data.services.length === 0) {
      return;
    }

    // If there are services, validate them strictly
    if (data.services.length > 0) {
      // Require expiry date
      if (!data.expiresAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data de validade é obrigatória",
          path: ['expiresAt'],
        });
      }

      // Validate each service
      data.services.forEach((service, index) => {
        if (!service.description || service.description.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Descrição é obrigatória",
            path: ['services', index, 'description'],
          });
        }

        // Amount can be empty (defaults to 0 for courtesy), only reject negative values
        if (typeof service.amount === 'number' && service.amount < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Valor não pode ser negativo",
            path: ['services', index, 'amount'],
          });
        }
      });
    }
  })
  .transform((data) => {
    // Transform empty pricing to undefined
    if (!data || !data.services || data.services.length === 0) {
      return undefined;
    }
    return data;
  });

export const taskPricingSchema = z.object({
  id: z.string().uuid().optional(),
  budgetNumber: z.number().optional(),
  subtotal: z.number().min(0),
  total: z.number().min(0),
  expiresAt: z.coerce.date(),
  status: taskPricingStatusSchema,
  services: z.array(taskPricingServiceSchema).min(1, 'Pelo menos um serviço é obrigatório'),
  // Guarantee Terms
  guaranteeYears: guaranteeYearsSchema.optional().nullable(),
  customGuaranteeText: z.string().max(2000).optional().nullable(),
  // Custom Forecast
  customForecastDays: z.number().int().min(1).max(30).optional().nullable(),
  // Layout File
  layoutFileId: z.string().uuid().optional().nullable(),
  // Customer configs for per-customer billing (at least 1 required)
  customerConfigs: z.array(taskPricingCustomerConfigSchema).min(1, 'Pelo menos uma configuração de cliente é obrigatória'),
  // Advanced pricing features
  simultaneousTasks: z.number().int().min(1).max(100).optional().nullable(),
});

export type TaskPricingFormData = z.infer<typeof taskPricingSchema>;
export type TaskPricingServiceFormData = z.infer<typeof taskPricingServiceSchema>;
export type TaskPricingCustomerConfigFormData = z.infer<typeof taskPricingCustomerConfigSchema>;
export type TaskPricingCreateNestedFormData = z.infer<typeof taskPricingCreateNestedSchema>;
