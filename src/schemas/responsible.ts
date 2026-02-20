import { z } from 'zod';
import { ResponsibleRole } from '@/types/responsible';

// Phone validation regex (Brazilian format)
const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})$/;

// Email validation
const emailSchema = z
  .string()
  .email('Email inválido')
  .optional()
  .or(z.literal(''));

// Password validation (min 6 chars when provided)
const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres')
  .optional()
  .or(z.literal(''));

// Responsible create schema
export const responsibleCreateSchema = z.object({
  email: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    emailSchema,
  ),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(phoneRegex, 'Formato de telefone inválido'),
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  password: passwordSchema,
  companyId: z
    .string()
    .uuid('ID da empresa inválido'),
  role: z.nativeEnum(ResponsibleRole, {
    errorMap: () => ({ message: 'Função inválida' }),
  }),
  isActive: z
    .boolean()
    .optional()
    .default(true),
});

// Responsible update schema
export const responsibleUpdateSchema = z.object({
  email: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    emailSchema,
  ),
  phone: z
    .string()
    .regex(phoneRegex, 'Formato de telefone inválido')
    .optional(),
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  password: passwordSchema,
  role: z
    .nativeEnum(ResponsibleRole, {
      errorMap: () => ({ message: 'Função inválida' }),
    })
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});

// Responsible search/filter schema
export const responsibleGetManySchema = z.object({
  page: z
    .number()
    .min(1)
    .optional()
    .default(1),
  pageSize: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  search: z
    .string()
    .optional(),
  companyId: z
    .string()
    .uuid('ID da empresa inválido')
    .optional(),
  role: z
    .nativeEnum(ResponsibleRole)
    .optional(),
  isActive: z
    .boolean()
    .optional(),
  include: z
    .array(z.string())
    .optional(),
});

// Responsible login schema
export const responsibleLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

// Password update schema
export const responsiblePasswordUpdateSchema = z.object({
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Batch operations schemas
export const responsibleBatchCreateSchema = z.object({
  responsibles: z
    .array(responsibleCreateSchema)
    .min(1, 'Pelo menos um responsável deve ser fornecido')
    .max(50, 'Máximo de 50 responsáveis por operação'),
});

export const responsibleBatchUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid('ID inválido'),
        data: responsibleUpdateSchema,
      })
    )
    .min(1, 'Pelo menos uma atualização deve ser fornecida')
    .max(50, 'Máximo de 50 atualizações por operação'),
});

export const responsibleBatchDeleteSchema = z.object({
  ids: z
    .array(z.string().uuid('ID inválido'))
    .min(1, 'Pelo menos um ID deve ser fornecido')
    .max(50, 'Máximo de 50 exclusões por operação'),
});

// Inline responsible creation (used in task create to create responsibles alongside the task)
export const responsibleCreateInlineSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z.string().min(1, 'Telefone é obrigatório').regex(phoneRegex, 'Formato de telefone inválido'),
  email: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().email('Email inválido').optional(),
  ),
  role: z.nativeEnum(ResponsibleRole, {
    errorMap: () => ({ message: 'Função inválida' }),
  }),
  isActive: z.boolean().optional().default(true),
  companyId: z.string().uuid('ID da empresa inválido').optional(),
});

// Type exports
export type ResponsibleCreateInlineFormData = z.infer<typeof responsibleCreateInlineSchema>;
export type ResponsibleCreateFormData = z.infer<typeof responsibleCreateSchema>;
export type ResponsibleUpdateFormData = z.infer<typeof responsibleUpdateSchema>;
export type ResponsibleGetManyFormData = z.infer<typeof responsibleGetManySchema>;
export type ResponsibleLoginFormData = z.infer<typeof responsibleLoginSchema>;
export type ResponsiblePasswordUpdateFormData = z.infer<typeof responsiblePasswordUpdateSchema>;
export type ResponsibleBatchCreateFormData = z.infer<typeof responsibleBatchCreateSchema>;
export type ResponsibleBatchUpdateFormData = z.infer<typeof responsibleBatchUpdateSchema>;
export type ResponsibleBatchDeleteFormData = z.infer<typeof responsibleBatchDeleteSchema>;
