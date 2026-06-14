// hooks/useWorkAccident.ts
// CAT — Comunicação de Acidente de Trabalho (Medicina do Trabalho, Part E)

import {
  getWorkAccidentReports,
  getWorkAccidentReportById,
  createWorkAccidentReport,
  updateWorkAccidentReport,
  deleteWorkAccidentReport,
  batchCreateWorkAccidentReports,
  batchUpdateWorkAccidentReports,
  batchDeleteWorkAccidentReports,
} from "@/api-client";
import type {
  WorkAccidentReportGetManyFormData,
  WorkAccidentReportCreateFormData,
  WorkAccidentReportUpdateFormData,
  WorkAccidentReportBatchCreateFormData,
  WorkAccidentReportBatchUpdateFormData,
  WorkAccidentReportBatchDeleteFormData,
} from "@/schemas";
import type {
  WorkAccidentReport,
  WorkAccidentReportGetManyResponse,
  WorkAccidentReportGetUniqueResponse,
  WorkAccidentReportCreateResponse,
  WorkAccidentReportUpdateResponse,
  WorkAccidentReportDeleteResponse,
  WorkAccidentReportBatchCreateResponse,
  WorkAccidentReportBatchUpdateResponse,
  WorkAccidentReportBatchDeleteResponse,
} from "@/types";
import { workAccidentKeys, userKeys, changeLogKeys } from "./queryKeys";
import { createEntityHooks } from "./createEntityHooks";

// =====================================================
// WorkAccidentReport Service Adapter
// =====================================================

const workAccidentReportServiceAdapter = {
  getMany: getWorkAccidentReports,
  getById: getWorkAccidentReportById,
  create: createWorkAccidentReport,
  update: updateWorkAccidentReport,
  delete: deleteWorkAccidentReport,
  batchCreate: batchCreateWorkAccidentReports,
  batchUpdate: batchUpdateWorkAccidentReports,
  batchDelete: batchDeleteWorkAccidentReports,
};

// =====================================================
// Base WorkAccidentReport Hooks
// =====================================================

const baseHooks = createEntityHooks<
  WorkAccidentReportGetManyFormData,
  WorkAccidentReportGetManyResponse,
  WorkAccidentReportGetUniqueResponse,
  WorkAccidentReportCreateFormData,
  WorkAccidentReportCreateResponse,
  WorkAccidentReportUpdateFormData,
  WorkAccidentReportUpdateResponse,
  WorkAccidentReportDeleteResponse,
  WorkAccidentReportBatchCreateFormData,
  WorkAccidentReportBatchCreateResponse<WorkAccidentReport>,
  WorkAccidentReportBatchUpdateFormData,
  WorkAccidentReportBatchUpdateResponse<WorkAccidentReport>,
  WorkAccidentReportBatchDeleteFormData,
  WorkAccidentReportBatchDeleteResponse
>({
  queryKeys: workAccidentKeys,
  service: workAccidentReportServiceAdapter,
  staleTime: 1000 * 60 * 5, // 5 minutes
  relatedQueryKeys: [userKeys, changeLogKeys],
});

export const useWorkAccidentReportsInfinite = baseHooks.useInfiniteList;
export const useWorkAccidentReports = baseHooks.useList;
export const useWorkAccidentReport = baseHooks.useDetail;
export const useWorkAccidentReportMutations = baseHooks.useMutations;
export const useWorkAccidentReportBatchMutations = baseHooks.useBatchMutations;
