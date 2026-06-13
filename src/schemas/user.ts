// packages/schemas/src/user.ts

import { z } from "zod";
import { createMapToFormDataHelper, orderByDirectionSchema, normalizeOrderBy, emailSchema, phoneSchema, cpfSchema, pisSchema, createNameSchema, nullableDate, createDateSchema } from "./common";
import type { User } from '../types';
import { CONTRACT_TYPE, CONTRACT_STATUS, EMPLOYEE_TYPE, VERIFICATION_TYPE, SECTOR_PRIVILEGES } from '../constants';

// =====================
// Include Schema Based on Prisma Schema (Second Level Only)
// =====================

export const userIncludeSchema = z
  .object({
    // Direct User relations
    currentContract: z
      .union([
        z.boolean(),
        z.object({
          include: z.any().optional(),
        }),
      ])
      .optional(),
    employmentContracts: z
      .union([
        z.boolean(),
        z.object({
          include: z.any().optional(),
          where: z.any().optional(),
          orderBy: z.any().optional(),
        }),
      ])
      .optional(),
    ppeSize: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              user: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    preference: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              notifications: z.boolean().optional(),
              user: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    position: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              users: z.boolean().optional(),
              remunerations: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    sector: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              users: z.boolean().optional(),
              tasks: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    ledSector: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              users: z.boolean().optional(),
              tasks: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    activities: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              item: z.boolean().optional(),
              user: z.boolean().optional(),
              order: z.boolean().optional(),
              orderItem: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    borrows: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              item: z.boolean().optional(),
              user: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    notifications: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              user: z.boolean().optional(),
              seenBy: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    createdTasks: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              sector: z.boolean().optional(),
              customer: z.boolean().optional(),
              budget: z.boolean().optional(),
              nfe: z.boolean().optional(),
              receipt: z.boolean().optional(),
              observation: z.boolean().optional(),
              generalPainting: z.boolean().optional(),
              createdBy: z.boolean().optional(),
              files: z.boolean().optional(),
              logoPaints: z.boolean().optional(),
              bonifications: z.boolean().optional(),
              services: z.boolean().optional(),
              truck: z.boolean().optional(),
              airbrushing: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    bonuses: z
      .union([
        z.boolean(),
        z.object({
          include: z
            .object({
              user: z.boolean().optional(),
              task: z.boolean().optional(),
            })
            .optional(),
        }),
      ])
      .optional(),
    warningsCollaborator: z.boolean().optional(),
    warningsSupervisor: z.boolean().optional(),
    warningsWitness: z.boolean().optional(),
    ppeDeliveries: z.boolean().optional(),
    ppeDeliveriesReviewed: z.boolean().optional(),
    changeLogs: z.boolean().optional(),
    seenNotification: z.boolean().optional(),
    _count: z.union([z.boolean(), z.object({ select: z.record(z.boolean()).optional() })]).optional(),
  })
  .partial();

// =====================
// OrderBy Schema Based on Prisma Schema Fields
// =====================

export const userOrderBySchema = z.union([
  // Single ordering object
  z
    .object({
      // User direct fields
      id: orderByDirectionSchema.optional(),
      email: orderByDirectionSchema.optional(),
      name: orderByDirectionSchema.optional(),
      currentContractType: orderByDirectionSchema.optional(),
      currentContractStatus: orderByDirectionSchema.optional(),
      currentEmployeeType: orderByDirectionSchema.optional(),
      phone: orderByDirectionSchema.optional(),
      positionId: orderByDirectionSchema.optional(),
      pis: orderByDirectionSchema.optional(),
      cpf: orderByDirectionSchema.optional(),
      verified: orderByDirectionSchema.optional(),
      birth: orderByDirectionSchema.optional(),
      performanceLevel: orderByDirectionSchema.optional(),
      sectorId: orderByDirectionSchema.optional(),
      payrollNumber: orderByDirectionSchema.optional(),
      createdAt: orderByDirectionSchema.optional(),
      updatedAt: orderByDirectionSchema.optional(),

      // Nested relation ordering
      position: z
        .object({
          id: orderByDirectionSchema.optional(),
          name: orderByDirectionSchema.optional(),
          createdAt: orderByDirectionSchema.optional(),
          updatedAt: orderByDirectionSchema.optional(),
        })
        .optional(),

      sector: z
        .object({
          id: orderByDirectionSchema.optional(),
          name: orderByDirectionSchema.optional(),
          createdAt: orderByDirectionSchema.optional(),
          updatedAt: orderByDirectionSchema.optional(),
        })
        .optional(),

      ledSector: z
        .object({
          id: orderByDirectionSchema.optional(),
          name: orderByDirectionSchema.optional(),
          createdAt: orderByDirectionSchema.optional(),
          updatedAt: orderByDirectionSchema.optional(),
        })
        .optional(),
    })
    .partial(),

  // Array of ordering objects for multiple field ordering
  z.array(
    z
      .object({
        id: orderByDirectionSchema.optional(),
        email: orderByDirectionSchema.optional(),
        name: orderByDirectionSchema.optional(),
        currentContractType: orderByDirectionSchema.optional(),
        currentContractStatus: orderByDirectionSchema.optional(),
        currentEmployeeType: orderByDirectionSchema.optional(),
        phone: orderByDirectionSchema.optional(),
        positionId: orderByDirectionSchema.optional(),
        pis: orderByDirectionSchema.optional(),
        cpf: orderByDirectionSchema.optional(),
        verified: orderByDirectionSchema.optional(),
        birth: orderByDirectionSchema.optional(),
        performanceLevel: orderByDirectionSchema.optional(),
        sectorId: orderByDirectionSchema.optional(),
        payrollNumber: orderByDirectionSchema.optional(),
        createdAt: orderByDirectionSchema.optional(),
        updatedAt: orderByDirectionSchema.optional(),
      })
      .partial(),
  ),
]);

// =====================
// Where Schema Based on Prisma Schema Fields
// =====================

export const userWhereSchema: z.ZodSchema = z.lazy(() =>
  z
    .object({
      // Logical operators
      AND: z.union([userWhereSchema, z.array(userWhereSchema)]).optional(),
      OR: z.array(userWhereSchema).optional(),
      NOT: z.union([userWhereSchema, z.array(userWhereSchema)]).optional(),

      // User fields
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

      email: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            contains: z.string().optional(),
            startsWith: z.string().optional(),
            endsWith: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      name: z
        .union([
          z.string(),
          z.object({
            equals: z.string().optional(),
            not: z.string().optional(),
            contains: z.string().optional(),
            startsWith: z.string().optional(),
            endsWith: z.string().optional(),
            mode: z.enum(["default", "insensitive"]).optional(),
          }),
        ])
        .optional(),

      currentContractType: z
        .union([
          z.nativeEnum(CONTRACT_TYPE),
          z.object({
            equals: z.nativeEnum(CONTRACT_TYPE).optional(),
            not: z.nativeEnum(CONTRACT_TYPE).optional(),
            in: z.array(z.nativeEnum(CONTRACT_TYPE)).optional(),
            notIn: z.array(z.nativeEnum(CONTRACT_TYPE)).optional(),
          }),
        ])
        .optional(),

      currentContractStatus: z
        .union([
          z.nativeEnum(CONTRACT_STATUS),
          z.object({
            equals: z.nativeEnum(CONTRACT_STATUS).optional(),
            not: z.nativeEnum(CONTRACT_STATUS).optional(),
            in: z.array(z.nativeEnum(CONTRACT_STATUS)).optional(),
            notIn: z.array(z.nativeEnum(CONTRACT_STATUS)).optional(),
          }),
        ])
        .optional(),

      currentEmployeeType: z
        .union([
          z.nativeEnum(EMPLOYEE_TYPE),
          z.object({
            equals: z.nativeEnum(EMPLOYEE_TYPE).optional(),
            not: z.nativeEnum(EMPLOYEE_TYPE).optional(),
            in: z.array(z.nativeEnum(EMPLOYEE_TYPE)).optional(),
            notIn: z.array(z.nativeEnum(EMPLOYEE_TYPE)).optional(),
          }),
        ])
        .optional(),

      phone: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            contains: z.string().optional(),
            startsWith: z.string().optional(),
            endsWith: z.string().optional(),
          }),
        ])
        .optional(),

      cpf: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            contains: z.string().optional(),
          }),
        ])
        .optional(),

      pis: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            contains: z.string().optional(),
          }),
        ])
        .optional(),

      verified: z
        .union([
          z.boolean(),
          z.object({
            equals: z.boolean().optional(),
            not: z.boolean().optional(),
          }),
        ])
        .optional(),

      birth: z
        .union([
          z.date(),
          z.object({
            equals: z.date().optional(),
            not: z.date().optional(),
            gte: z.coerce.date().optional(),
            gt: z.coerce.date().optional(),
            lte: z.coerce.date().optional(),
            lt: z.coerce.date().optional(),
          }),
        ])
        .optional(),

      performanceLevel: z
        .union([
          z.number(),
          z.object({
            equals: z.number().optional(),
            not: z.number().optional(),
            gte: z.number().optional(),
            gt: z.number().optional(),
            lte: z.number().optional(),
            lt: z.number().optional(),
          }),
        ])
        .optional(),

      positionId: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
          }),
        ])
        .optional(),

      sectorId: z
        .union([
          z.string(),
          z.null(),
          z.object({
            equals: z.union([z.string(), z.null()]).optional(),
            not: z.union([z.string(), z.null()]).optional(),
            in: z.array(z.string()).optional(),
            notIn: z.array(z.string()).optional(),
          }),
        ])
        .optional(),

      createdAt: z
        .union([
          z.date(),
          z.object({
            equals: z.date().optional(),
            not: z.date().optional(),
            gte: z.coerce.date().optional(),
            gt: z.coerce.date().optional(),
            lte: z.coerce.date().optional(),
            lt: z.coerce.date().optional(),
          }),
        ])
        .optional(),

      updatedAt: z
        .union([
          z.date(),
          z.object({
            equals: z.date().optional(),
            not: z.date().optional(),
            gte: z.coerce.date().optional(),
            gt: z.coerce.date().optional(),
            lte: z.coerce.date().optional(),
            lt: z.coerce.date().optional(),
          }),
        ])
        .optional(),

      secullumEmployeeId: z
        .union([
          z.number(),
          z.null(),
          z.object({
            equals: z.union([z.number(), z.null()]).optional(),
            not: z.union([z.number(), z.null()]).optional(),
            in: z.array(z.number()).optional(),
            notIn: z.array(z.number()).optional(),
          }),
        ])
        .optional(),

      // Relation filters
      currentContract: z
        .object({
          is: z.any().optional(),
          isNot: z.any().optional(),
        })
        .optional(),

      employmentContracts: z
        .object({
          some: z.any().optional(),
          every: z.any().optional(),
          none: z.any().optional(),
        })
        .optional(),

      position: z
        .object({
          is: z.any().optional(),
          isNot: z.any().optional(),
        })
        .optional(),

      sector: z
        .object({
          is: z.any().optional(),
          isNot: z.any().optional(),
        })
        .optional(),

      activities: z
        .object({
          some: z.any().optional(),
          every: z.any().optional(),
          none: z.any().optional(),
        })
        .optional(),

      borrows: z
        .object({
          some: z.any().optional(),
          every: z.any().optional(),
          none: z.any().optional(),
        })
        .optional(),

      createdTasks: z
        .object({
          some: z.any().optional(),
          every: z.any().optional(),
          none: z.any().optional(),
        })
        .optional(),

      bonuses: z
        .object({
          some: z.any().optional(),
          every: z.any().optional(),
          none: z.any().optional(),
        })
        .optional(),
    })
    .partial(),
);

// =====================
// Convenience Filters
// =====================

const userFilters = {
  searchingFor: z.string().optional(),
  sectorIds: z.array(z.string()).optional(),
  positionIds: z.array(z.string()).optional(),
  contractTypes: z.array(z.nativeEnum(CONTRACT_TYPE)).optional(),
  contractStatuses: z.array(z.nativeEnum(CONTRACT_STATUS)).optional(),
  employeeTypes: z.array(z.nativeEnum(EMPLOYEE_TYPE)).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  hasPosition: z.boolean().optional(),
  hasSector: z.boolean().optional(),
  hasPpeSize: z.boolean().optional(),
  hasActivities: z.boolean().optional(),
  hasTasks: z.boolean().optional(),
  showDismissed: z.boolean().optional(),
  hasLedSector: z.boolean().optional(),
  performanceLevelRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  exp1StartAtRange: z
    .object({
      gte: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
    })
    .optional(),
  // Sector privilege filters - filter users by their sector's privilege level
  excludeSectorPrivileges: z.array(z.nativeEnum(SECTOR_PRIVILEGES)).optional(),
  includeSectorPrivileges: z.array(z.nativeEnum(SECTOR_PRIVILEGES)).optional(),
};

// =====================
// Transform Function
// =====================

const userTransform = (data: any) => {
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

  // Handle searchingFor
  if (data.searchingFor && typeof data.searchingFor === "string" && data.searchingFor.trim()) {
    andConditions.push({
      OR: [
        { name: { contains: data.searchingFor.trim(), mode: "insensitive" } },
        { email: { contains: data.searchingFor.trim(), mode: "insensitive" } },
        { phone: { contains: data.searchingFor.trim() } },
        { cpf: { contains: data.searchingFor.trim() } },
        { pis: { contains: data.searchingFor.trim() } },
      ],
    });
    delete data.searchingFor;
  }

  // Handle sectorIds filter
  if (data.sectorIds && Array.isArray(data.sectorIds) && data.sectorIds.length > 0) {
    andConditions.push({ sectorId: { in: data.sectorIds } });
    delete data.sectorIds;
  }

  // Handle positionIds filter
  if (data.positionIds && Array.isArray(data.positionIds) && data.positionIds.length > 0) {
    andConditions.push({ positionId: { in: data.positionIds } });
    delete data.positionIds;
  }

  // Handle contractTypes filter — maps to the current-vínculo type cache.
  if (data.contractTypes && Array.isArray(data.contractTypes) && data.contractTypes.length > 0) {
    andConditions.push({ currentContractType: { in: data.contractTypes } });
    delete data.contractTypes;
  }

  // Handle contractStatuses filter — maps to the current-vínculo status cache.
  if (data.contractStatuses && Array.isArray(data.contractStatuses) && data.contractStatuses.length > 0) {
    andConditions.push({ currentContractStatus: { in: data.contractStatuses } });
    delete data.contractStatuses;
  }

  // Handle employeeTypes filter (worker category — CLT/PJ/terceirizado/etc.)
  if (data.employeeTypes && Array.isArray(data.employeeTypes) && data.employeeTypes.length > 0) {
    andConditions.push({ currentEmployeeType: { in: data.employeeTypes } });
    delete data.employeeTypes;
  }

  // Handle isActive filter
  // isActive now mirrors the current contract's lifecycle status: a collaborator
  // is active when their current vínculo is not DISMISSED.
  if (typeof data.isActive === "boolean") {
    andConditions.push({
      currentContractStatus: data.isActive
        ? { not: CONTRACT_STATUS.DISMISSED }  // Active = current vínculo not dismissed
        : CONTRACT_STATUS.DISMISSED            // Inactive = current vínculo dismissed
    });
    delete data.isActive;
  }

  // Handle isVerified filter
  if (typeof data.isVerified === "boolean") {
    andConditions.push({ verified: data.isVerified });
    delete data.isVerified;
  }

  // Handle hasPosition filter
  if (typeof data.hasPosition === "boolean") {
    if (data.hasPosition) {
      andConditions.push({ positionId: { not: null } });
    } else {
      andConditions.push({ positionId: null });
    }
    delete data.hasPosition;
  }

  // Handle hasSector filter
  if (typeof data.hasSector === "boolean") {
    if (data.hasSector) {
      andConditions.push({ sectorId: { not: null } });
    } else {
      andConditions.push({ sectorId: null });
    }
    delete data.hasSector;
  }

  // Handle hasPpeSize filter
  if (typeof data.hasPpeSize === "boolean") {
    if (data.hasPpeSize) {
      andConditions.push({ ppeSize: { is: { id: { not: undefined } } } });
    } else {
      andConditions.push({ ppeSize: { is: null } });
    }
    delete data.hasPpeSize;
  }

  // Handle hasActivities filter
  if (typeof data.hasActivities === "boolean") {
    if (data.hasActivities) {
      andConditions.push({ activities: { some: {} } });
    } else {
      andConditions.push({ activities: { none: {} } });
    }
    delete data.hasActivities;
  }

  // Handle hasTasks filter
  if (typeof data.hasTasks === "boolean") {
    if (data.hasTasks) {
      andConditions.push({ createdTasks: { some: {} } });
    } else {
      andConditions.push({ createdTasks: { none: {} } });
    }
    delete data.hasTasks;
  }

  // Handle hasLedSector filter
  if (typeof data.hasLedSector === "boolean") {
    if (data.hasLedSector) {
      andConditions.push({ ledSector: { is: { id: { not: undefined } } } });
    } else {
      andConditions.push({ ledSector: { is: null } });
    }
    delete data.hasLedSector;
  }

  // Handle performanceLevelRange filter
  if (data.performanceLevelRange && typeof data.performanceLevelRange === "object") {
    const levelCondition: any = {};
    if (typeof data.performanceLevelRange.min === "number") levelCondition.gte = data.performanceLevelRange.min;
    if (typeof data.performanceLevelRange.max === "number") levelCondition.lte = data.performanceLevelRange.max;
    if (Object.keys(levelCondition).length > 0) {
      andConditions.push({ performanceLevel: levelCondition });
    }
    delete data.performanceLevelRange;
  }

  // Handle exp1StartAtRange filter
  if (data.exp1StartAtRange && typeof data.exp1StartAtRange === "object") {
    const dateCondition: any = {};
    if (data.exp1StartAtRange.gte) {
      const fromDate = data.exp1StartAtRange.gte instanceof Date
        ? data.exp1StartAtRange.gte
        : new Date(data.exp1StartAtRange.gte);
      // Set to start of day (00:00:00)
      fromDate.setHours(0, 0, 0, 0);
      dateCondition.gte = fromDate;
    }
    if (data.exp1StartAtRange.lte) {
      const toDate = data.exp1StartAtRange.lte instanceof Date
        ? data.exp1StartAtRange.lte
        : new Date(data.exp1StartAtRange.lte);
      // Set to end of day (23:59:59.999)
      toDate.setHours(23, 59, 59, 999);
      dateCondition.lte = toDate;
    }
    if (Object.keys(dateCondition).length > 0) {
      // Admission date now lives on the current employment contract.
      andConditions.push({ currentContract: { is: { admissionDate: dateCondition } } });
    }
    delete data.exp1StartAtRange;
  }

  // Handle excludeSectorPrivileges filter - exclude users whose sector has specific privileges
  if (data.excludeSectorPrivileges && Array.isArray(data.excludeSectorPrivileges) && data.excludeSectorPrivileges.length > 0) {
    andConditions.push({
      OR: [
        // Include users with no sector
        { sectorId: null },
        // Include users whose sector privilege is NOT in the excluded list
        { sector: { is: { privileges: { notIn: data.excludeSectorPrivileges } } } },
      ],
    });
    delete data.excludeSectorPrivileges;
  }

  // Handle includeSectorPrivileges filter - only include users whose sector has specific privileges
  if (data.includeSectorPrivileges && Array.isArray(data.includeSectorPrivileges) && data.includeSectorPrivileges.length > 0) {
    andConditions.push({
      sector: { is: { privileges: { in: data.includeSectorPrivileges } } },
    });
    delete data.includeSectorPrivileges;
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

// =====================
// Select Schema for Performance Optimization
// =====================

export const userSelectSchema = z.record(z.union([
  z.boolean(),
  z.object({
    select: z.record(z.any()).optional(),
    orderBy: z.any().optional(),
    take: z.number().optional(),
    where: z.any().optional(),
  }),
])).optional();

export const userGetManySchema = z
  .object({
    // Pagination
    page: z.coerce.number().int().min(0).default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    take: z.coerce.number().int().positive().max(100).optional(), // alias for limit
    skip: z.coerce.number().int().min(0).optional(),

    // Direct Prisma clauses
    where: userWhereSchema.optional(),
    orderBy: userOrderBySchema.optional(),
    include: userIncludeSchema.optional(),
    // Select for performance optimization - fetch only needed fields
    select: userSelectSchema,

    // Convenience filters
    ...userFilters,

    // Date filters
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
  })
  .transform(userTransform);

// =====================
// Additional Schemas
// =====================

// =====================
// CRUD Schemas
// =====================

// PPE Size nested creation schema
const ppeSizeCreateNestedSchema = z.object({
  shirts: z.string().nullable().optional(),
  boots: z.string().nullable().optional(),
  pants: z.string().nullable().optional(),
  shorts: z.string().nullable().optional(),
  sleeves: z.string().nullable().optional(),
  mask: z.string().nullable().optional(),
  gloves: z.string().nullable().optional(),
  rainBoots: z.string().nullable().optional(),
});

// Notification preferences nested creation schema
const notificationPreferenceCreateNestedSchema = z.object({
  notificationType: z.string(),
  enabled: z.boolean().default(true),
  channels: z.array(z.string()).default(["EMAIL"]),
  importance: z.string().default("MEDIUM"),
});

// First employment contract (vínculo) created together with the collaborator.
// When omitted, the service defaults employeeType=CLT, contractType=EXPERIENCE_PERIOD_1
// and uses the user's admissionDate (positionId/sectorId mirror the user).
export const userContractCreateNestedSchema = z.object({
  employeeType: z
    .enum(Object.values(EMPLOYEE_TYPE) as [string, ...string[]], {
      errorMap: () => ({ message: "Categoria de colaborador inválida" }),
    })
    .default(EMPLOYEE_TYPE.CLT),
  contractType: z
    .enum(Object.values(CONTRACT_TYPE) as [string, ...string[]], {
      errorMap: () => ({ message: "Tipo de contrato inválido" }),
    })
    .nullable()
    .optional(),
  admissionDate: nullableDate.optional(),
  positionId: z.string().uuid("Cargo inválido").nullable().optional(),
  sectorId: z.string().uuid("Setor inválido").nullable().optional(),
  payrollNumber: z.number().int().positive("Número da folha deve ser positivo").nullable().optional(),
  providerName: z.string().nullable().optional(),
  providerCnpj: z.string().nullable().optional(),
});

export const userCreateSchema = z
  .object({
    email: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      emailSchema.nullable().optional(),
    ),
    name: createNameSchema(2, 200, "Nome"),
    avatarId: z.string().uuid("Avatar inválido").nullable().optional(),
    // First vínculo (EmploymentContract) created with the collaborator. Optional;
    // the service defaults employeeType=CLT, contractType=EXPERIENCE_PERIOD_1.
    contract: userContractCreateNestedSchema.optional(),
    phone: phoneSchema.nullable().optional(),
    // Cargo (position) — required at create time. The bound Secullum função is
    // resolved from it, and HR workflows assume every collaborator has a cargo.
    // userUpdateSchema keeps it nullable.optional so legacy rows aren't blocked.
    positionId: z
      .string({
        required_error: "Cargo é obrigatório",
        invalid_type_error: "Cargo é obrigatório",
      })
      .uuid("Cargo inválido"),
    pis: pisSchema.nullable().optional(),
    // CPF — required at create time. Secullum requires it for funcionario
    // creation and Brazilian payroll mandates it. userUpdateSchema keeps it
    // nullable.optional so legacy rows aren't blocked.
    cpf: z
      .string({
        required_error: "CPF é obrigatório",
        invalid_type_error: "CPF é obrigatório",
      })
      .min(1, "CPF é obrigatório")
      .pipe(cpfSchema),
    verified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    performanceLevel: z.number().int().min(0).max(5).default(0),
    // Setor (sector) — required at create time. Drives the Secullum departamento
    // mapping and sector-scoped permissions/reports. userUpdateSchema keeps it
    // nullable.optional so legacy rows aren't blocked.
    sectorId: z
      .string({
        required_error: "Setor é obrigatório",
        invalid_type_error: "Setor é obrigatório",
      })
      .uuid("Setor inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").nullable().optional(),

    // Address fields
    address: z.string().min(1, "Endereço é obrigatório").nullable().optional(),
    addressNumber: z.string().min(1, "Número é obrigatório").nullable().optional(),
    addressComplement: z.string().nullable().optional(),
    neighborhood: z.string().min(1, "Bairro é obrigatório").nullable().optional(),
    city: z.string().min(1, "Cidade é obrigatória").nullable().optional(),
    state: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().length(2, "Estado deve ter 2 caracteres").nullable().optional()
    ),
    zipCode: z.string().nullable().optional(),
    site: z.string().url("URL inválida").nullable().optional(),

    // Additional dates - birth is required. createDateSchema rejects null/''
    // first; a bare z.coerce.date() would coerce an empty field to the 1970
    // epoch and pass the age refine below.
    birth: createDateSchema("Data de nascimento").refine(
      (date) => {
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return date <= eighteenYearsAgo;
      },
      { message: "O colaborador deve ter pelo menos 18 anos" }
    ),

    // Payroll info — required at create time (Secullum NumeroFolha + payroll
    // computations). userUpdateSchema keeps it nullable.optional for editing
    // existing rows that pre-date this constraint.
    payrollNumber: z
      .number({
        required_error: "Número da folha é obrigatório",
        invalid_type_error: "Número da folha deve ser numérico",
      })
      .int()
      .positive("Número da folha deve ser positivo"),

    // Nested PPE size creation for new users
    ppeSize: ppeSizeCreateNestedSchema.optional(),
    // Nested notification preferences creation
    notificationPreferences: z.array(notificationPreferenceCreateNestedSchema).optional(),
    // Required for changelog tracking
    userId: z.string().optional(),
    // Sector leader flag - when true, sets this user as leader of the selected sector
    // The backend will update Sector.leaderId accordingly
    isSectorLeader: z.boolean().default(false),
    // Payroll fields (parity with api/src/schemas/user.ts userCreateSchema).
    unionMember: z.boolean().default(false),
    unionAuthorizationDate: nullableDate.optional(),
    dependentsCount: z.number().int().min(0).default(0),
    hasSimplifiedDeduction: z.boolean().default(true),
    // Secullum integration toggle (parity with web <SecullumSyncSwitch />).
    secullumSyncEnabled: z.boolean().default(false).optional(),
    // Per-user override for Secullum Horario.Id (parity with web <HorarioSelector />).
    secullumHorarioId: z.number().int().nullable().optional(),
  })
  .refine((data) => data.email || data.phone, {
    message: "Email ou telefone deve ser fornecido",
    path: ["email"], // Show error on email field
  });

export const userUpdateSchema = z
  .object({
    email: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? null : val),
      emailSchema.nullable().optional(),
    ),
    name: createNameSchema(2, 200, "Nome").optional(),
    avatarId: z.string().uuid("Avatar inválido").nullable().optional(),
    // Current-vínculo cache mirrors (derived; kept in sync by the API on contract writes).
    currentContractType: z.nativeEnum(CONTRACT_TYPE).nullable().optional(),
    currentContractStatus: z.nativeEnum(CONTRACT_STATUS).nullable().optional(),
    currentEmployeeType: z.nativeEnum(EMPLOYEE_TYPE).nullable().optional(),
    phone: phoneSchema.nullable().optional(),
    positionId: z.string().uuid("Cargo inválido").nullable().optional(),
    pis: pisSchema.nullable().optional(),
    cpf: cpfSchema.nullable().optional(),
    verified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    performanceLevel: z.number().int().min(0).max(5).optional(),
    sectorId: z.string().uuid("Setor inválido").nullable().optional(),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").nullable().optional(),

    // Address fields
    address: z.string().nullable().optional(),
    addressNumber: z.string().nullable().optional(),
    addressComplement: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.preprocess(
      (val) => (val === "" ? null : val),
      z.string().length(2, "Estado deve ter 2 caracteres").nullable().optional()
    ),
    zipCode: z.string().nullable().optional(),
    site: z.string().url("URL inválida").nullable().optional(),

    // Additional dates
    birth: z.coerce
      .date()
      .refine(
        (date) => {
          const eighteenYearsAgo = new Date();
          eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
          return date <= eighteenYearsAgo;
        },
        { message: "O colaborador deve ter pelo menos 18 anos" }
      )
      .optional(),

    // Payroll info
    payrollNumber: z.number().int().positive("Número da folha deve ser positivo").nullable().optional(),

    // PPE Sizes
    ppeSize: ppeSizeCreateNestedSchema.optional(),

    verificationCode: z.string().nullable().optional(),
    verificationExpiresAt: z.date().nullable().optional(),
    verificationType: z
      .enum(Object.values(VERIFICATION_TYPE) as [string, ...string[]])
      .nullable()
      .optional(),
    requirePasswordChange: z.boolean().optional(),
    lastLoginAt: z.date().optional(),
    sessionToken: z.string().nullable().optional(),
    // Required for changelog tracking
    userId: z.string().optional(),
    preferences: z.record(z.any()).optional(),
    // Sector leader flag - when true, sets this user as leader of the selected sector
    // The backend will update Sector.leaderId accordingly
    isSectorLeader: z.boolean().optional(),
    // Secullum integration toggle (parity with web <SecullumSyncSwitch />).
    secullumSyncEnabled: z.boolean().optional(),
    // Per-user override for Secullum Horario.Id (parity with web <HorarioSelector />).
    secullumHorarioId: z.number().int().nullable().optional(),
  });

// =====================
// Batch Operations Schemas
// =====================

export const userBatchCreateSchema = z.object({
  users: z.array(userCreateSchema),
});

export const userBatchUpdateSchema = z.object({
  users: z
    .array(
      z.object({
        id: z.string().uuid("Usuário inválido"),
        data: userUpdateSchema,
      }),
    )
    .min(1, "Pelo menos uma atualização é necessária"),
});

export const userBatchDeleteSchema = z.object({
  userIds: z.array(z.string().uuid("Usuário inválido")).min(1, "Pelo menos um ID deve ser fornecido"),
});

// Query schema for include/select parameter
export const userQuerySchema = z.object({
  include: userIncludeSchema.optional(),
  select: userSelectSchema,
});

// =====================
// Additional Query Schemas
// =====================

export const userGetByIdSchema = z.object({
  include: userIncludeSchema.optional(),
  // Select for performance optimization - fetch only needed fields
  select: userSelectSchema,
});

// =====================
// Type Inference (FormData types)
// =====================

export type UserGetManyFormData = z.infer<typeof userGetManySchema>;
export type UserGetByIdFormData = z.infer<typeof userGetByIdSchema>;
export type UserQueryFormData = z.infer<typeof userQuerySchema>;

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

export type UserBatchCreateFormData = z.infer<typeof userBatchCreateSchema>;
export type UserBatchUpdateFormData = z.infer<typeof userBatchUpdateSchema>;
export type UserBatchDeleteFormData = z.infer<typeof userBatchDeleteSchema>;

export type UserInclude = z.infer<typeof userIncludeSchema>;
export type UserSelect = z.infer<typeof userSelectSchema>;
export type UserOrderBy = z.infer<typeof userOrderBySchema>;
export type UserWhere = z.infer<typeof userWhereSchema>;

// =====================
// Helper Functions
// =====================

export const mapUserToFormData = createMapToFormDataHelper<User, UserUpdateFormData>((user) => ({
  email: user.email || undefined,
  name: user.name,
  currentContractType: user.currentContractType ?? undefined,
  currentContractStatus: user.currentContractStatus ?? undefined,
  currentEmployeeType: user.currentEmployeeType ?? undefined,
  phone: user.phone || undefined,
  positionId: user.positionId || undefined,
  pis: user.pis || undefined,
  cpf: user.cpf || undefined,
  verified: user.verified,
  performanceLevel: user.performanceLevel,
  sectorId: user.sectorId || undefined,
  password: undefined, // Never map password from existing user

  // Address fields
  address: user.address || undefined,
  addressNumber: user.addressNumber || undefined,
  addressComplement: user.addressComplement || undefined,
  neighborhood: user.neighborhood || undefined,
  city: user.city || undefined,
  state: user.state || undefined,
  zipCode: user.zipCode || undefined,
  // site: user.site || undefined,

  // Additional dates
  birth: user.birth ?? undefined,

  // Payroll info
  payrollNumber: user.payrollNumber || undefined,
}));
