import {
  createRepresentative,
  deleteRepresentative,
  getRepresentativeById,
  getRepresentatives,
  updateRepresentative,
  batchCreateRepresentatives,
  batchUpdateRepresentatives,
  batchDeleteRepresentatives,
} from '@/api-client';
import type {
  RepresentativeCreateFormData,
  RepresentativeUpdateFormData,
  RepresentativeGetManyFormData,
  RepresentativeBatchCreateFormData,
  RepresentativeBatchUpdateFormData,
  RepresentativeBatchDeleteFormData,
} from '@/schemas';
import type {
  Representative,
  RepresentativeGetManyResponse,
} from '@/types';
import { representativeKeys, customerKeys, changeLogKeys } from "./queryKeys";
import { createEntityHooks } from "./createEntityHooks";

const representativeService = {
  getMany: getRepresentatives,
  getById: getRepresentativeById,
  create: createRepresentative,
  update: updateRepresentative,
  delete: deleteRepresentative,
  batchCreate: batchCreateRepresentatives,
  batchUpdate: batchUpdateRepresentatives,
  batchDelete: batchDeleteRepresentatives,
};

const baseHooks = createEntityHooks<
  RepresentativeGetManyFormData,
  RepresentativeGetManyResponse,
  Representative,
  RepresentativeCreateFormData,
  Representative,
  RepresentativeUpdateFormData,
  Representative,
  void,
  RepresentativeBatchCreateFormData,
  Representative[],
  RepresentativeBatchUpdateFormData,
  Representative[],
  RepresentativeBatchDeleteFormData,
  void
>({
  queryKeys: representativeKeys,
  service: representativeService,
  staleTime: 1000 * 60 * 5,
  relatedQueryKeys: [customerKeys, changeLogKeys],
});

export const useRepresentativesInfinite = baseHooks.useInfiniteList;
export const useRepresentatives = baseHooks.useList;
export const useRepresentative = baseHooks.useDetail;
export const useRepresentativeMutations = baseHooks.useMutations;
export const useRepresentativeBatchMutations = baseHooks.useBatchMutations;
