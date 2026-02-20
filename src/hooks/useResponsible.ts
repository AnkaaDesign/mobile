import {
  createResponsible,
  deleteResponsible,
  getResponsibleById,
  getResponsibles,
  updateResponsible,
  batchCreateResponsibles,
  batchUpdateResponsibles,
  batchDeleteResponsibles,
} from '@/api-client';
import type {
  ResponsibleCreateFormData,
  ResponsibleUpdateFormData,
  ResponsibleGetManyFormData,
  ResponsibleBatchCreateFormData,
  ResponsibleBatchUpdateFormData,
  ResponsibleBatchDeleteFormData,
} from '@/schemas';
import type {
  Responsible,
  ResponsibleGetManyResponse,
} from '@/types';
import { responsibleKeys, customerKeys, changeLogKeys } from "./queryKeys";
import { createEntityHooks } from "./createEntityHooks";

const responsibleService = {
  getMany: getResponsibles,
  getById: getResponsibleById,
  create: createResponsible,
  update: updateResponsible,
  delete: deleteResponsible,
  batchCreate: batchCreateResponsibles,
  batchUpdate: batchUpdateResponsibles,
  batchDelete: batchDeleteResponsibles,
};

const baseHooks = createEntityHooks<
  ResponsibleGetManyFormData,
  ResponsibleGetManyResponse,
  Responsible,
  ResponsibleCreateFormData,
  Responsible,
  ResponsibleUpdateFormData,
  Responsible,
  void,
  ResponsibleBatchCreateFormData,
  Responsible[],
  ResponsibleBatchUpdateFormData,
  Responsible[],
  ResponsibleBatchDeleteFormData,
  void
>({
  queryKeys: responsibleKeys,
  service: responsibleService,
  staleTime: 1000 * 60 * 5,
  relatedQueryKeys: [customerKeys, changeLogKeys],
});

export const useResponsiblesInfinite = baseHooks.useInfiniteList;
export const useResponsibles = baseHooks.useList;
export const useResponsible = baseHooks.useDetail;
export const useResponsibleMutations = baseHooks.useMutations;
export const useResponsibleBatchMutations = baseHooks.useBatchMutations;
