// packages/schemas/src/commission.ts

import { z } from "zod";
import { COMMISSION_STATUS } from "@/constants";
import { taskIncludeSchema, taskOrderBySchema } from "./task";
import { userIncludeSchema, userOrderBySchema } from "./user";

// =====================
// Include Schema
// =====================

export const commissionIncludeSchema = z
  .object({
    task: z
      .union([
        z.boolean(),
        z.object({
          include: taskIncludeSchema.optional(),
        }),
      ])
      .optional(),
    user: z
      .union([
        z.boolean(),
        z.object({
          include: userIncludeSchema.optional(),
        }),
      ])
      .optional(),
  })
  .optional();

export type CommissionInclude = z.infer<typeof commissionIncludeSchema>;

// =====================
// OrderBy Schema
// =====================

export const commissionOrderBySchema = z
  .object({
    id: z.enum(["asc", "desc"]).optional(),
    status: z.enum(["asc", "desc"]).optional(),
    reason: z.enum(["asc", "desc"]).optional(),
    taskId: z.enum(["asc", "desc"]).optional(),
    userId: z.enum(["asc", "desc"]).optional(),
    createdAt: z.enum(["asc", "desc"]).optional(),
    updatedAt: z.enum(["asc", "desc"]).optional(),
    task: taskOrderBySchema.optional(),
    user: userOrderBySchema.optional(),
  })
  .optional();

export type CommissionOrderBy = z.infer<typeof commissionOrderBySchema>;

// =====================
// Where Schema
// =====================

export const commissionWhereSchema = z.object({
  id: z.string().optional(),
  status: z.nativeEnum(COMMISSION_STATUS).optional(),
  statuses: z.array(z.nativeEnum(COMMISSION_STATUS)).optional(),
  reason: z.string().optional(),
  taskId: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  createdAt: z
    .object({
      gte: z.union([z.string(), z.date()]).optional(),
      lte: z.union([z.string(), z.date()]).optional(),
    })
    .optional(),
  updatedAt: z
    .object({
      gte: z.union([z.string(), z.date()]).optional(),
      lte: z.union([z.string(), z.date()]).optional(),
    })
    .optional(),
}).optional();

export type CommissionWhere = z.infer<typeof commissionWhereSchema>;

// =====================
// GetMany Schema
// =====================

export const commissionGetManySchema = z.object({
  where: commissionWhereSchema.optional(),
  include: commissionIncludeSchema.optional(),
  orderBy: z.union([commissionOrderBySchema, z.array(commissionOrderBySchema)]).optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  cursor: z.string().optional(),
});

export type CommissionGetManyFormData = z.infer<typeof commissionGetManySchema>;

// =====================
// GetById Schema
// =====================

export const commissionGetByIdSchema = z.object({
  id: z.string(),
  include: commissionIncludeSchema.optional(),
});

export type CommissionGetByIdFormData = z.infer<typeof commissionGetByIdSchema>;

// =====================
// Query Schema
// =====================

export const commissionQuerySchema = z.object({
  where: commissionWhereSchema.optional(),
  include: commissionIncludeSchema.optional(),
  orderBy: z.union([commissionOrderBySchema, z.array(commissionOrderBySchema)]).optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  cursor: z.string().optional(),
});

export type CommissionQueryFormData = z.infer<typeof commissionQuerySchema>;

// =====================
// Create Schema
// =====================

export const commissionCreateSchema = z.object({
  status: z.nativeEnum(COMMISSION_STATUS),
  reason: z.string().nullable().optional(),
  taskId: z.string(),
  userId: z.string(),
});

export type CommissionCreateFormData = z.infer<typeof commissionCreateSchema>;

// =====================
// Update Schema
// =====================

export const commissionUpdateSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(COMMISSION_STATUS).optional(),
  reason: z.string().nullable().optional(),
  taskId: z.string().optional(),
  userId: z.string().optional(),
});

export type CommissionUpdateFormData = z.infer<typeof commissionUpdateSchema>;

// =====================
// Batch Schemas
// =====================

export const commissionBatchCreateSchema = z.object({
  data: z.array(commissionCreateSchema),
});

export type CommissionBatchCreateFormData = z.infer<typeof commissionBatchCreateSchema>;

export const commissionBatchUpdateSchema = z.object({
  data: z.array(commissionUpdateSchema),
});

export type CommissionBatchUpdateFormData = z.infer<typeof commissionBatchUpdateSchema>;

export const commissionBatchDeleteSchema = z.object({
  ids: z.array(z.string()),
});

export type CommissionBatchDeleteFormData = z.infer<typeof commissionBatchDeleteSchema>;

// =====================
// Mapper Function
// =====================

export const mapCommissionToFormData = (commission: any): CommissionUpdateFormData => {
  return {
    id: commission.id,
    status: commission.status,
    reason: commission.reason,
    taskId: commission.taskId,
    userId: commission.userId,
  };
};
