// linked-exam-status.tsx (mobile)
// Reusable block showing the occupational exam (ASO) linked to a flow
// (admission → ADMISSION, termination → DISMISSAL): status/result badges +
// a "Ver ASO" link to the exam detail. Exams are auto-created by the server
// when a process advances, but this also covers legacy processes where the
// exam does not exist yet (then it renders the empty/"Agendar exame" path).
// Mirrors web src/components/occupational-health/medical-exam/detail/linked-exam-status.tsx.

import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconStethoscope, IconExternalLink, IconLoader2 } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { useMedicalExams } from "@/hooks";
import { mobileRoute } from "@/constants/routes.types";
import {
  routes,
  MEDICAL_EXAM_STATUS,
  MEDICAL_EXAM_STATUS_LABELS,
  MEDICAL_EXAM_RESULT,
  MEDICAL_EXAM_RESULT_LABELS,
  MEDICAL_EXAM_TYPE,
} from "@/constants";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formatDate } from "@/utils";
import type { MedicalExam } from "@/types";

/**
 * Fetches the most recent (non-cancelled) exam of the given type for the user.
 * `createdAfter` restricts to exams belonging to the current process (e.g. the
 * dismissal exam created since the termination started).
 */
export function useLinkedMedicalExam(userId: string | undefined, type: MEDICAL_EXAM_TYPE, createdAfter?: Date | string | null) {
  const query = useMedicalExams(
    {
      where: {
        userId,
        type,
        status: { not: MEDICAL_EXAM_STATUS.CANCELLED },
        ...(createdAfter
          ? {
              OR: [{ createdAt: { gte: new Date(createdAfter) } }, { scheduledAt: { gte: new Date(createdAfter) } }],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      limit: 1,
    } as any,
    { enabled: !!userId },
  );

  const exam = ((query.data as any)?.data?.[0] as MedicalExam | undefined) ?? null;
  return { exam, isLoading: query.isLoading, refetch: query.refetch };
}

function statusVariant(status: MedicalExam["status"]) {
  switch (status) {
    case MEDICAL_EXAM_STATUS.COMPLETED:
      return "success";
    case MEDICAL_EXAM_STATUS.EXPIRED:
      return "destructive";
    case MEDICAL_EXAM_STATUS.CANCELLED:
      return "secondary";
    default:
      return "warning";
  }
}

function resultVariant(result: MedicalExam["result"]) {
  switch (result) {
    case MEDICAL_EXAM_RESULT.FIT:
      return "success";
    case MEDICAL_EXAM_RESULT.UNFIT:
      return "destructive";
    case MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS:
      return "warning";
    default:
      return "secondary";
  }
}

interface LinkedExamStatusProps {
  userId: string | undefined;
  type: MEDICAL_EXAM_TYPE;
  /** Restrict to exams created/scheduled from this date (current process). */
  createdAfter?: Date | string | null;
  /** Text shown when no exam is found. */
  emptyText?: string;
}

export function LinkedExamStatus({ userId, type, createdAfter, emptyText = "Nenhum exame encontrado." }: LinkedExamStatusProps) {
  const { colors } = useTheme();
  const nav = useNav();
  const { exam, isLoading } = useLinkedMedicalExam(userId, type, createdAfter);

  if (isLoading) {
    return (
      <View style={styles.row}>
        <IconLoader2 size={16} color={colors.mutedForeground} />
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Carregando exame...</ThemedText>
      </View>
    );
  }

  if (!exam) {
    return (
      <View style={styles.row}>
        <IconStethoscope size={16} color={colors.mutedForeground} />
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>{emptyText}</ThemedText>
      </View>
    );
  }

  const relevantDate = exam.examDate ?? exam.scheduledAt;

  return (
    <View style={styles.examRow}>
      <IconStethoscope size={16} color={colors.mutedForeground} />
      <Badge variant={statusVariant(exam.status) as any} size="sm">
        <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
          {MEDICAL_EXAM_STATUS_LABELS[exam.status] || exam.status}
        </ThemedText>
      </Badge>
      {exam.result && exam.result !== MEDICAL_EXAM_RESULT.PENDING && (
        <Badge variant={resultVariant(exam.result) as any} size="sm">
          <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
            {MEDICAL_EXAM_RESULT_LABELS[exam.result] || exam.result}
          </ThemedText>
        </Badge>
      )}
      {relevantDate && (
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>
          {exam.examDate ? "Realizado em" : "Agendado para"} {formatDate(relevantDate)}
        </ThemedText>
      )}
      <TouchableOpacity
        onPress={() => nav.push(mobileRoute(routes.personnelDepartment.occupationalHealth.medicalExams.details(exam.id)))}
        style={styles.link}
        activeOpacity={0.7}
      >
        <ThemedText style={[styles.linkText, { color: colors.primary }]}>Ver ASO</ThemedText>
        <IconExternalLink size={13} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  examRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs },
  muted: { fontSize: fontSize.sm },
  badgeText: { fontSize: fontSize.xs },
  link: { flexDirection: "row", alignItems: "center", gap: 2 },
  linkText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
