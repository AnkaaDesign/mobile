// packages/schemas/src/warehouse-location.ts

import { z } from "zod";
import { createMapToFormDataHelper, orderByDirectionSchema, normalizeOrderBy } from "./common";
import type { WarehouseLocation } from "../types";
import { WAREHOUSE_LOCATION_TYPE } from "../constants";

const warehouseLocationTypeSchema = z.nativeEnum(WAREHOUSE_LOCATION_TYPE);

// =====================
// Include Schema
// =====================

export const warehouseLocationIncludeSchema = z
  .object({
    items: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              brands: z.boolean().optional(),
              category: z.boolean().optional(),
              supplier: z.boolean().optional(),
              warehouseLocation: z.boolean().optional(),
              price: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    _count: z
      .union([
        z.boolean(),
        z.object({
          select: z
            .object({
              items: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
  })
  .partial();

// =====================
// OrderBy Schema
// =====================

export const warehouseLocationOrderBySchema = z
  .union([
    z
      .object({
        id: orderByDirectionSchema.optional(),
        name: orderByDirectionSchema.optional(),
        type: orderByDirectionSchema.optional(),
        section: orderByDirectionSchema.optional(),
        code: orderByDirectionSchema.optional(),
        description: orderByDirectionSchema.optional(),
        isActive: orderByDirectionSchema.optional(),
        levels: orderByDirectionSchema.optional(),
        columns: orderByDirectionSchema.optional(),
        createdAt: orderByDirectionSchema.optional(),
        updatedAt: orderByDirectionSchema.optional(),
        _count: z
          .object({
            items: orderByDirectionSchema.optional(),
          })
          .optional(),
      })
      .partial(),
    z.array(
      z
        .object({
          id: orderByDirectionSchema.optional(),
          name: orderByDirectionSchema.optional(),
          section: orderByDirectionSchema.optional(),
          code: orderByDirectionSchema.optional(),
          isActive: orderByDirectionSchema.optional(),
          createdAt: orderByDirectionSchema.optional(),
          updatedAt: orderByDirectionSchema.optional(),
        })
        .partial(),
    ),
  ])
  .optional();

// =====================
// Where Schema
// =====================

export const warehouseLocationWhereSchema: z.ZodSchema = z.lazy(() =>
  z
    .object({
      AND: z.union([warehouseLocationWhereSchema, z.array(warehouseLocationWhereSchema)]).optional(),
      OR: z.array(warehouseLocationWhereSchema).optional(),
      NOT: z.union([warehouseLocationWhereSchema, z.array(warehouseLocationWhereSchema)]).optional(),

      id: z
        .union([
          z.string(),
          z.object({
            equals: z.string().optional(),
            not: z.string().optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
          }),
        ])
        .optional(),

      name: z
        .union([
          z.string(),
          z.object({
            equals: z.string().optional(),
            not: z.string().optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
            contains: z.string().optional(),
            startsWith: z.string().optional(),
            endsWith: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      type: z
        .union([
          warehouseLocationTypeSchema,
          z.object({
            equals: warehouseLocationTypeSchema.optional(),
            not: warehouseLocationTypeSchema.optional(),
            in: z.array(warehouseLocationTypeSchema).optional(),
            notIn: z.array(warehouseLocationTypeSchema).optional(),
          }),
        ])
        .optional(),

      section: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.string().nullable().optional(),
            not: z.string().nullable().optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
            contains: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      code: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.string().nullable().optional(),
            not: z.string().nullable().optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
            contains: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      description: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.string().nullable().optional(),
            not: z.string().nullable().optional(),
            contains: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      isActive: z
        .union([
          z.boolean(),
          z.object({
            equals: z.boolean().optional(),
            not: z.boolean().optional(),
          }),
        ])
        .optional(),

      items: z
        .object({
          some: z.lazy(() => z.any()).optional(),
          every: z.lazy(() => z.any()).optional(),
          none: z.lazy(() => z.any()).optional(),
        })
        .optional(),

      createdAt: z
        .union([
          z.date(),
          z.object({
            equals: z.date().optional(),
            not: z.date().optional(),
            gt: z.coerce.date().optional(),
            gte: z.coerce.date().optional(),
            lt: z.coerce.date().optional(),
            lte: z.coerce.date().optional(),
          }),
        ])
        .optional(),

      updatedAt: z
        .union([
          z.date(),
          z.object({
            equals: z.date().optional(),
            not: z.date().optional(),
            gt: z.coerce.date().optional(),
            gte: z.coerce.date().optional(),
            lt: z.coerce.date().optional(),
            lte: z.coerce.date().optional(),
          }),
        ])
        .optional(),
    })
    .partial(),
);

// =====================
// Transform Function
// =====================

const warehouseLocationTransform = (data: any): any => {
  // Normalize orderBy to Prisma format
  if (data.orderBy) {
    data.orderBy = normalizeOrderBy(data.orderBy);
  }

  // Handle take/limit alias
  if (data.take && !data.limit) {
    data.limit = data.take;
  }
  delete data.take;

  const andConditions: any[] = [];

  // Handle searchingFor - search in name, section, code, description
  if (data.searchingFor && typeof data.searchingFor === "string" && data.searchingFor.trim()) {
    andConditions.push({
      OR: [
        { name: { contains: data.searchingFor.trim(), mode: "insensitive" } },
        { section: { contains: data.searchingFor.trim(), mode: "insensitive" } },
        { code: { contains: data.searchingFor.trim(), mode: "insensitive" } },
        { description: { contains: data.searchingFor.trim(), mode: "insensitive" } },
      ],
    });
    delete data.searchingFor;
  }

  // Handle isActive convenience filter
  if (typeof data.isActive === "boolean") {
    andConditions.push({ isActive: data.isActive });
    delete data.isActive;
  }

  // Handle hasItems filter
  if (typeof data.hasItems === "boolean") {
    if (data.hasItems) {
      andConditions.push({ items: { some: {} } });
    } else {
      andConditions.push({ items: { none: {} } });
    }
    delete data.hasItems;
  }

  // Handle sections filter
  if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
    andConditions.push({ section: { in: data.sections } });
    delete data.sections;
  }

  // Handle types filter
  if (data.types && Array.isArray(data.types) && data.types.length > 0) {
    andConditions.push({ type: { in: data.types } });
    delete data.types;
  }

  // Handle date filters
  if (data.createdAt) {
    andConditions.push({ createdAt: data.createdAt });
    delete data.createdAt;
  }

  if (data.updatedAt) {
    andConditions.push({ updatedAt: data.updatedAt });
    delete data.updatedAt;
  }

  // Merge with existing where conditions
  if (andConditions.length > 0) {
    if (data.where) {
      if (data.where.AND && Array.isArray(data.where.AND)) {
        data.where.AND = [...data.where.AND, ...andConditions];
      } else {
        data.where = { AND: [data.where, ...andConditions] };
      }
    } else {
      data.where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
    }
  }

  return data;
};

// =====================
// Query Schema
// =====================

export const warehouseLocationGetManySchema = z
  .object({
    page: z.coerce.number().int().min(0).default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    take: z.coerce.number().int().positive().max(100).optional(),
    skip: z.coerce.number().int().min(0).optional(),

    // Convenience filter fields
    searchingFor: z.string().optional(),
    isActive: z.boolean().optional(),
    hasItems: z.boolean().optional(),
    sections: z.array(z.string()).optional(),
    types: z.array(warehouseLocationTypeSchema).optional(),
    createdAt: z
      .object({
        gte: z.coerce.date().optional(),
        lte: z.coerce.date().optional(),
      })
      .optional(),
    updatedAt: z
      .object({
        gte: z.coerce.date().optional(),
        lte: z.coerce.date().optional(),
      })
      .optional(),

    // Standard query fields
    where: warehouseLocationWhereSchema.optional(),
    orderBy: warehouseLocationOrderBySchema.optional(),
    include: warehouseLocationIncludeSchema.optional(),
  })
  .transform(warehouseLocationTransform);

// =====================
// CRUD Schemas
// =====================

export const warehouseLocationCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  type: warehouseLocationTypeSchema.optional().default(WAREHOUSE_LOCATION_TYPE.ESTANTE),
  section: z.string().max(200, "Setor deve ter no máximo 200 caracteres").nullable().optional(),
  code: z.string().max(50, "Código deve ter no máximo 50 caracteres").nullable().optional(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").nullable().optional(),
  isActive: z.boolean().default(true),
  levels: z.coerce.number().int().min(1, "Mínimo de 1 nível").max(100, "Máximo de 100 níveis").default(1),
  columns: z.coerce.number().int().min(1, "Mínimo de 1 coluna").max(100, "Máximo de 100 colunas").default(1),
  columnsPerLevel: z.array(z.coerce.number().int().min(1).max(100)).optional(),
  // Map placement (not surfaced in mobile UI — kept for parity)
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  rotation: z.number().nullable().optional(),
});

export const warehouseLocationUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres").optional(),
  type: warehouseLocationTypeSchema.optional(),
  section: z.string().max(200, "Setor deve ter no máximo 200 caracteres").nullable().optional(),
  code: z.string().max(50, "Código deve ter no máximo 50 caracteres").nullable().optional(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").nullable().optional(),
  isActive: z.boolean().optional(),
  levels: z.coerce.number().int().min(1, "Mínimo de 1 nível").max(100, "Máximo de 100 níveis").optional(),
  columns: z.coerce.number().int().min(1, "Mínimo de 1 coluna").max(100, "Máximo de 100 colunas").optional(),
  columnsPerLevel: z.array(z.coerce.number().int().min(1).max(100)).optional(),
  // Map placement (not surfaced in mobile UI — kept for parity)
  positionX: z.number().nullable().optional(),
  positionY: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  rotation: z.number().nullable().optional(),
});

// =====================
// Batch Operations Schemas
// =====================

export const warehouseLocationBatchCreateSchema = z.object({
  warehouseLocations: z.array(warehouseLocationCreateSchema),
});

export const warehouseLocationBatchUpdateSchema = z.object({
  warehouseLocations: z
    .array(
      z.object({
        id: z.string().uuid("Localização inválida"),
        data: warehouseLocationUpdateSchema,
      }),
    )
    .min(1, "Pelo menos uma localização deve ser fornecida"),
});

export const warehouseLocationBatchDeleteSchema = z.object({
  warehouseLocationIds: z.array(z.string().uuid("Localização inválida")).min(1, "Pelo menos um ID deve ser fornecido"),
});

// Query schema for include parameter
export const warehouseLocationQuerySchema = z.object({
  include: warehouseLocationIncludeSchema.optional(),
});

// =====================
// GetById Schema
// =====================

export const warehouseLocationGetByIdSchema = z.object({
  include: warehouseLocationIncludeSchema.optional(),
});

// =====================
// Type Inference (FormData types)
// =====================

export type WarehouseLocationGetManyFormData = z.infer<typeof warehouseLocationGetManySchema>;
export type WarehouseLocationGetByIdFormData = z.infer<typeof warehouseLocationGetByIdSchema>;
export type WarehouseLocationQueryFormData = z.infer<typeof warehouseLocationQuerySchema>;

export type WarehouseLocationCreateFormData = z.infer<typeof warehouseLocationCreateSchema>;
export type WarehouseLocationUpdateFormData = z.infer<typeof warehouseLocationUpdateSchema>;

export type WarehouseLocationBatchCreateFormData = z.infer<typeof warehouseLocationBatchCreateSchema>;
export type WarehouseLocationBatchUpdateFormData = z.infer<typeof warehouseLocationBatchUpdateSchema>;
export type WarehouseLocationBatchDeleteFormData = z.infer<typeof warehouseLocationBatchDeleteSchema>;

export type WarehouseLocationInclude = z.infer<typeof warehouseLocationIncludeSchema>;
export type WarehouseLocationOrderBy = z.infer<typeof warehouseLocationOrderBySchema>;
export type WarehouseLocationWhere = z.infer<typeof warehouseLocationWhereSchema>;

// =====================
// Helper Functions
// =====================

export const mapWarehouseLocationToFormData = createMapToFormDataHelper<WarehouseLocation, WarehouseLocationUpdateFormData>((location) => ({
  name: location.name,
  type: location.type,
  section: location.section,
  code: location.code,
  description: location.description,
  isActive: location.isActive,
  levels: location.levels,
  columns: location.columns,
  columnsPerLevel: location.columnsPerLevel,
}));
