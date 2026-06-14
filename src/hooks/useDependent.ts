// hooks/useDependent.ts
// Dependentes do colaborador (dedução IRRF / salário-família)

import { getDependents, getDependentById, createDependent, updateDependent, deleteDependent, batchCreateDependents, batchUpdateDependents, batchDeleteDependents } from "@/api-client";
import type { DependentGetManyFormData, DependentCreateFormData, DependentUpdateFormData, DependentBatchCreateFormData, DependentBatchUpdateFormData, DependentBatchDeleteFormData } from "@/schemas";
import type {
  Dependent,
  DependentGetManyResponse,
  DependentGetUniqueResponse,
  DependentCreateResponse,
  DependentUpdateResponse,
  DependentDeleteResponse,
  DependentBatchCreateResponse,
  DependentBatchUpdateResponse,
  DependentBatchDeleteResponse,
} from "@/types";
import { dependentKeys } from "./queryKeys";
import { createEntityHooks } from "./createEntityHooks";

// =====================================================
// Dependent Service Adapter
// =====================================================

const dependentServiceAdapter = {
  getMany: getDependents,
  getById: getDependentById,
  create: createDependent,
  update: updateDependent,
  delete: deleteDependent,
  batchCreate: batchCreateDependents,
  batchUpdate: batchUpdateDependents,
  batchDelete: batchDeleteDependents,
};

// =====================================================
// Base Dependent Hooks
// =====================================================

const baseHooks = createEntityHooks<
  DependentGetManyFormData,
  DependentGetManyResponse,
  DependentGetUniqueResponse,
  DependentCreateFormData,
  DependentCreateResponse,
  DependentUpdateFormData,
  DependentUpdateResponse,
  DependentDeleteResponse,
  DependentBatchCreateFormData,
  DependentBatchCreateResponse<Dependent>,
  DependentBatchUpdateFormData,
  DependentBatchUpdateResponse<Dependent>,
  DependentBatchDeleteFormData,
  DependentBatchDeleteResponse
>({
  queryKeys: dependentKeys,
  service: dependentServiceAdapter,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

export const useDependentsInfinite = baseHooks.useInfiniteList;
export const useDependents = baseHooks.useList;
export const useDependent = baseHooks.useDetail;
export const useDependentMutations = baseHooks.useMutations;
export const useDependentBatchMutations = baseHooks.useBatchMutations;

// Legacy alias
export { useDependent as useDependentDetail };
