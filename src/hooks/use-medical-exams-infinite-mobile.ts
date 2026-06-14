import { useMemo } from "react";
import { useMedicalExamsInfinite } from "./useMedicalExam";
import type { MedicalExamGetManyFormData } from "@/schemas";
import type { MedicalExam } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_MEDICAL_EXAMS_PAGE_SIZE = 25;

/**
 * Mobile-optimized infinite scroll hook for medical exams (ASO).
 * Resolved by name from the list-config `query.hook` string.
 */
export function useMedicalExamsInfiniteMobile(params?: Partial<MedicalExamGetManyFormData> & { enabled?: boolean }) {
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_MEDICAL_EXAMS_PAGE_SIZE,
    }),
    [params],
  );

  const infiniteQuery = useMedicalExamsInfinite(queryParams);

  return useInfiniteMobile<MedicalExam>(infiniteQuery);
}
