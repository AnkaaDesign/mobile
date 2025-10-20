# HR Module - Entity Patterns Quick Reference

## How to Add a New HR Entity

Follow this checklist to add a new entity maintaining consistency with existing patterns.

### 1. Create Schema (`src/schemas/entity-name.ts`)

```typescript
import { z } from "zod";
import { createMapToFormDataHelper, orderByDirectionSchema, normalizeOrderBy } from "./common";
import type { EntityName } from '../types';
import { ENTITY_ENUM } from '../constants';

// Step 1: Include Schema (relations to eager-load)
export const entityNameIncludeSchema = z.object({
  user: z.union([z.boolean(), z.object({...})]).optional(),
  _count: z.union([z.boolean(), z.object({...})]).optional(),
}).partial();

// Step 2: OrderBy Schema (for sorting)
export const entityNameOrderBySchema = z.union([
  z.object({
    id: orderByDirectionSchema.optional(),
    name: orderByDirectionSchema.optional(),
    createdAt: orderByDirectionSchema.optional(),
    // ... other sortable fields
  }).partial(),
  z.array(z.object({...}).partial()),
]);

// Step 3: Where Schema (for filtering)
export const entityNameWhereSchema: z.ZodSchema = z.lazy(() => 
  z.object({
    AND: z.array(entityNameWhereSchema).optional(),
    OR: z.array(entityNameWhereSchema).optional(),
    NOT: entityNameWhereSchema.optional(),
    
    // UUID fields
    id: z.union([...]).optional(),
    
    // String fields
    name: z.union([...]).optional(),
    
    // Enum fields
    status: z.union([
      z.enum(Object.values(ENTITY_ENUM) as [string, ...string[]]),
      z.object({...}),
    ]).optional(),
    
    // Date fields
    createdAt: z.union([...]).optional(),
    updatedAt: z.union([...]).optional(),
  }).partial(),
);

// Step 4: Convenience Filters (user-friendly filters)
const entityNameFilters = {
  searchingFor: z.string().optional(),
  statuses: z.array(z.enum(Object.values(ENTITY_ENUM) as [string, ...string[]])).optional(),
  // ... other convenience filters
};

// Step 5: Transform Function (convert filters to Prisma)
const entityNameTransform = (data: any) => {
  if (data.orderBy) {
    data.orderBy = normalizeOrderBy(data.orderBy);
  }
  if (data.take && !data.limit) {
    data.limit = data.take;
  }
  delete data.take;

  const andConditions: any[] = [];
  
  // Handle searchingFor
  if (data.searchingFor) {
    andConditions.push({
      OR: [
        { name: { contains: data.searchingFor.trim(), mode: "insensitive" } },
      ],
    });
    delete data.searchingFor;
  }

  // Handle statuses
  if (data.statuses?.length) {
    andConditions.push({ status: { in: data.statuses } });
    delete data.statuses;
  }

  // Merge with existing where
  if (andConditions.length > 0) {
    if (data.where) {
      data.where = data.where.AND 
        ? { ...data.where, AND: [...(data.where.AND || []), ...andConditions] }
        : { AND: andConditions };
    } else {
      data.where = andConditions.length === 1 ? andConditions[0] : { AND: andConditions };
    }
  }

  return data;
};

// Step 6: Query Schema
export const entityNameGetManySchema = z
  .object({
    // Pagination
    page: z.coerce.number().int().min(0).default(1).optional(),
    limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    take: z.coerce.number().int().positive().max(100).optional(),
    skip: z.coerce.number().int().min(0).optional(),

    // Prisma clauses
    where: entityNameWhereSchema.optional(),
    orderBy: entityNameOrderBySchema.optional(),
    include: entityNameIncludeSchema.optional(),

    // Convenience filters
    ...entityNameFilters,

    // Date filters
    createdAt: z.object({
      gte: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
    }).optional(),
    updatedAt: z.object({
      gte: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
    }).optional(),
  })
  .transform(entityNameTransform);

// Step 7: CRUD Schemas
export const entityNameCreateSchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(Object.values(ENTITY_ENUM) as [string, ...string[]]).default(ENTITY_ENUM.ACTIVE),
  // ... other fields
});

export const entityNameUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(Object.values(ENTITY_ENUM) as [string, ...string[]]).optional(),
  // ... other fields
}).transform(data => data);

// Step 8: Batch Schemas
export const entityNameBatchCreateSchema = z.object({
  entityNames: z.array(entityNameCreateSchema).min(1),
});

export const entityNameBatchUpdateSchema = z.object({
  entityNames: z.array(z.object({
    id: z.string().uuid(),
    data: entityNameUpdateSchema,
  })).min(1),
});

export const entityNameBatchDeleteSchema = z.object({
  entityNameIds: z.array(z.string().uuid()).min(1),
});

// Step 9: Get By ID & Query Schemas
export const entityNameGetByIdSchema = z.object({
  include: entityNameIncludeSchema.optional(),
  id: z.string().uuid(),
});

export const entityNameQuerySchema = z.object({
  include: entityNameIncludeSchema.optional(),
});

// Step 10: Inferred Types (automatically exported)
export type EntityNameGetManyFormData = z.infer<typeof entityNameGetManySchema>;
export type EntityNameGetByIdFormData = z.infer<typeof entityNameGetByIdSchema>;
export type EntityNameQueryFormData = z.infer<typeof entityNameQuerySchema>;
export type EntityNameCreateFormData = z.infer<typeof entityNameCreateSchema>;
export type EntityNameUpdateFormData = z.infer<typeof entityNameUpdateSchema>;
export type EntityNameBatchCreateFormData = z.infer<typeof entityNameBatchCreateSchema>;
export type EntityNameBatchUpdateFormData = z.infer<typeof entityNameBatchUpdateSchema>;
export type EntityNameBatchDeleteFormData = z.infer<typeof entityNameBatchDeleteSchema>;

// Step 11: Helper Mapping Function
export const mapEntityNameToFormData = createMapToFormDataHelper<EntityName, EntityNameUpdateFormData>(
  (entity) => ({
    name: entity.name,
    status: entity.status,
    // ... other fields
  })
);
```

### 2. Create API Client (`src/api-client/entity-name.ts`)

```typescript
import { apiClient } from "./axiosClient";
import type {
  // Schema types
  EntityNameGetManyFormData,
  EntityNameGetByIdFormData,
  EntityNameCreateFormData,
  EntityNameUpdateFormData,
  EntityNameBatchCreateFormData,
  EntityNameBatchUpdateFormData,
  EntityNameBatchDeleteFormData,
  EntityNameQueryFormData,
} from '../schemas';
import type {
  // Interface types
  EntityName,
  EntityNameGetUniqueResponse,
  EntityNameGetManyResponse,
  EntityNameCreateResponse,
  EntityNameUpdateResponse,
  EntityNameDeleteResponse,
  EntityNameBatchCreateResponse,
  EntityNameBatchUpdateResponse,
  EntityNameBatchDeleteResponse,
} from '../types';

export class EntityNameService {
  private readonly basePath = "/entity-names";

  // Query Operations
  async getEntityNames(params?: EntityNameGetManyFormData): Promise<EntityNameGetManyResponse> {
    const response = await apiClient.get<EntityNameGetManyResponse>(this.basePath, { params });
    return response.data;
  }

  async getEntityNameById(id: string, params?: Omit<EntityNameGetByIdFormData, "id">): Promise<EntityNameGetUniqueResponse> {
    const response = await apiClient.get<EntityNameGetUniqueResponse>(`${this.basePath}/${id}`, { params });
    return response.data;
  }

  // Mutation Operations
  async createEntityName(data: EntityNameCreateFormData, query?: EntityNameQueryFormData): Promise<EntityNameCreateResponse> {
    const response = await apiClient.post<EntityNameCreateResponse>(this.basePath, data, { params: query });
    return response.data;
  }

  async updateEntityName(id: string, data: EntityNameUpdateFormData, query?: EntityNameQueryFormData): Promise<EntityNameUpdateResponse> {
    const response = await apiClient.put<EntityNameUpdateResponse>(`${this.basePath}/${id}`, data, { params: query });
    return response.data;
  }

  async deleteEntityName(id: string): Promise<EntityNameDeleteResponse> {
    const response = await apiClient.delete<EntityNameDeleteResponse>(`${this.basePath}/${id}`);
    return response.data;
  }

  // Batch Operations
  async batchCreateEntityNames(data: EntityNameBatchCreateFormData, query?: EntityNameQueryFormData): Promise<EntityNameBatchCreateResponse<EntityName>> {
    const response = await apiClient.post<EntityNameBatchCreateResponse<EntityName>>(`${this.basePath}/batch`, data, { params: query });
    return response.data;
  }

  async batchUpdateEntityNames(data: EntityNameBatchUpdateFormData, query?: EntityNameQueryFormData): Promise<EntityNameBatchUpdateResponse<EntityName>> {
    const response = await apiClient.put<EntityNameBatchUpdateResponse<EntityName>>(`${this.basePath}/batch`, data, { params: query });
    return response.data;
  }

  async batchDeleteEntityNames(data: EntityNameBatchDeleteFormData, query?: EntityNameQueryFormData): Promise<EntityNameBatchDeleteResponse> {
    const response = await apiClient.delete<EntityNameBatchDeleteResponse>(`${this.basePath}/batch`, { data, params: query });
    return response.data;
  }

  // Specialized Operations (if needed)
  async getByStatus(status: string): Promise<EntityNameGetManyResponse> {
    const response = await apiClient.get<EntityNameGetManyResponse>(`${this.basePath}/by-status/${status}`);
    return response.data;
  }
}

// Export service instance
export const entityNameService = new EntityNameService();

// Export individual functions
export const getEntityNames = (params?: EntityNameGetManyFormData) => entityNameService.getEntityNames(params);
export const getEntityNameById = (id: string, params?: Omit<EntityNameGetByIdFormData, "id">) => entityNameService.getEntityNameById(id, params);
export const createEntityName = (data: EntityNameCreateFormData, query?: EntityNameQueryFormData) => entityNameService.createEntityName(data, query);
export const updateEntityName = (id: string, data: EntityNameUpdateFormData, query?: EntityNameQueryFormData) => entityNameService.updateEntityName(id, data, query);
export const deleteEntityName = (id: string) => entityNameService.deleteEntityName(id);
export const batchCreateEntityNames = (data: EntityNameBatchCreateFormData, query?: EntityNameQueryFormData) => entityNameService.batchCreateEntityNames(data, query);
export const batchUpdateEntityNames = (data: EntityNameBatchUpdateFormData, query?: EntityNameQueryFormData) => entityNameService.batchUpdateEntityNames(data, query);
export const batchDeleteEntityNames = (data: EntityNameBatchDeleteFormData, query?: EntityNameQueryFormData) => entityNameService.batchDeleteEntityNames(data, query);
```

### 3. Create Components

**Directory Structure:**
```
src/components/human-resources/entity-name/
├── list/
│   ├── entity-name-table.tsx
│   ├── entity-name-filter-modal.tsx    # or drawer
│   ├── entity-name-filter-tags.tsx
│   └── column-visibility-drawer.tsx
├── detail/
│   ├── index.ts
│   ├── entity-name-card.tsx
│   └── related-*.tsx
└── skeleton/
    ├── entity-name-list-skeleton.tsx
    ├── entity-name-detail-skeleton.tsx
    └── index.ts
```

### 4. Create Page (`src/app/(tabs)/human-resources/entity-names/list.tsx`)

The page orchestrates hooks, filters, and components into a cohesive list view.

---

## Common Pitfalls

❌ **DO NOT:**
- Forget `.transform(entityTransform)` on GetMany schema
- Mix Modal and Drawer filter patterns
- Use inconsistent sort behavior
- Create deep nested includes (2 levels max)
- Forget Portuguese validation messages
- Skip batch operation support

✓ **DO:**
- Follow the schema structure exactly
- Add both class method AND function exports
- Include all 8 schema types
- Add inferred types at the end
- Use consistent naming conventions
- Document custom endpoints

---

## Quick Checklist

- [ ] Schema created with all 11 components
- [ ] Types inferred correctly
- [ ] API Client created with service class
- [ ] Both Service and function exports added
- [ ] Components directory structure created
- [ ] List page connects everything
- [ ] Filter modal/drawer implemented
- [ ] Table component created
- [ ] Skeletons for loading states
- [ ] Detail page components
- [ ] All Portuguese validation messages

---

## Testing Integration

```typescript
// Test the schema
import { entityNameGetManySchema } from '@/schemas';

const testData = {
  searchingFor: "test",
  statuses: ["ACTIVE"],
  orderBy: { name: "asc" },
};

const result = entityNameGetManySchema.parse(testData);
// Should transform filters to Prisma format

// Test the API client
import { getEntityNames } from '@/api-client/entity-name';

const response = await getEntityNames({ 
  searchingFor: "test",
  limit: 10,
});
```

---

## File Checklist Template

```
schemas/entity-name.ts
├─ Include Schema ✓
├─ OrderBy Schema ✓
├─ Where Schema ✓
├─ Convenience Filters ✓
├─ Transform Function ✓
├─ GetMany Schema ✓
├─ Create Schema ✓
├─ Update Schema ✓
├─ Batch Schemas ✓
├─ GetByID Schema ✓
├─ Query Schema ✓
└─ Inferred Types ✓

api-client/entity-name.ts
├─ EntityNameService Class ✓
├─ Query Methods ✓
├─ Mutation Methods ✓
├─ Batch Methods ✓
├─ Custom Methods (if needed) ✓
├─ Service Instance Export ✓
└─ Function Exports ✓

components/human-resources/entity-name/
├─ list/entity-name-table.tsx ✓
├─ list/entity-name-filter-modal.tsx ✓
├─ list/entity-name-filter-tags.tsx ✓
├─ list/column-visibility-drawer.tsx ✓
├─ detail/entity-name-card.tsx ✓
├─ detail/index.ts ✓
├─ skeleton/entity-name-list-skeleton.tsx ✓
├─ skeleton/entity-name-detail-skeleton.tsx ✓
└─ skeleton/index.ts ✓

app/(tabs)/human-resources/
├─ entity-names/list.tsx ✓
├─ entity-names/details/[id].tsx (optional) ✓
├─ entity-names/create.tsx (optional) ✓
└─ entity-names/edit/[id].tsx (optional) ✓
```

