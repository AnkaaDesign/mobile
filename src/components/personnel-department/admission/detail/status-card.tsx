// status-card.tsx (mobile) — "Andamento da Admissão".
// Vertical stepper mirroring web's status-card steps (Cadastro → Documentação →
// Exame → Contrato → Registro → Concluída) with the current-status badge and the
// server-rule guards (blocking required docs / cancelled).

import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { IconCheck, IconBan, IconAlertTriangle, IconStethoscope } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { useMedicalExamMutations } from "@/hooks";
import { useAdmissionAdvance } from "@/hooks/useAdmission";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  routes,
  ADMISSION_STATUS,
  ADMISSION_STATUS_LABELS,
  MEDICAL_EXAM_TYPE,
  MEDICAL_EXAM_STATUS,
  MEDICAL_EXAM_RESULT,
} from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import type { Admission } from "@/types/admission";
import {
  ADMISSION_STATUS_CHAIN,
  getNextAdmissionStatus,
  getPreviousAdmissionStatus,
  hasBlockingRequiredDocs,
} from "../utils";
import { LinkedExamStatus, useLinkedMedicalExam } from "@/components/human-resources/medical-exam/detail/linked-exam-status";
import { CancelReasonModal } from "@/components/human-resources/shared/cancel-reason-modal";

interface StatusCardProps {
  admission: Admission;
  /** Whether the user may schedule the linked admission exam (ADMIN/HR). */
  canManage?: boolean;
}

const STEPPER_STEPS: { key: string; label: string }[] = [
  { key: "USER_REGISTRATION", label: "Cadastro de Colaborador" },
  { key: ADMISSION_STATUS.DOCS_PENDING, label: "Documentação" },
  { key: ADMISSION_STATUS.MEDICAL_EXAM, label: "Exame Admissional" },
  { key: ADMISSION_STATUS.CONTRACT, label: "Contrato" },
  { key: ADMISSION_STATUS.REGISTRATION, label: "Registro" },
  { key: ADMISSION_STATUS.COMPLETED, label: "Concluída" },
];

export function StatusCard({ admission, canManage }: StatusCardProps) {
  const { colors } = useTheme();
  const nav = useNav();
  const { createAsync } = useMedicalExamMutations();
  const advance = useAdmissionAdvance();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const isCancelled = admission.status === ADMISSION_STATUS.CANCELLED;
  const isCompleted = admission.status === ADMISSION_STATUS.COMPLETED;
  const isTerminal = isCancelled || isCompleted;
  const currentIndex = ADMISSION_STATUS_CHAIN.indexOf(admission.status as ADMISSION_STATUS);
  const stepperIndex = currentIndex + 1; // offset by the always-done registration step
  const blockedByDocs = hasBlockingRequiredDocs(admission);

  const nextStatus = getNextAdmissionStatus(admission.status as ADMISSION_STATUS);
  const prevStatus = getPreviousAdmissionStatus(admission.status as ADMISSION_STATUS);

  const handleAdvance = () => {
    if (!nextStatus) return;
    Alert.alert(
      "Avançar Etapa",
      `Avançar para "${ADMISSION_STATUS_LABELS[nextStatus]}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Avançar",
          onPress: async () => {
            try {
              await nav.withLoading(async () => advance.mutateAsync({ id: admission.id }));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  // The server accepts the previous status as a "retroceder etapa" move.
  const handleRegress = () => {
    if (!prevStatus) return;
    Alert.alert(
      "Voltar Etapa",
      `Retroceder para "${ADMISSION_STATUS_LABELS[prevStatus]}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Voltar Etapa",
          onPress: async () => {
            try {
              await nav.withLoading(async () => advance.mutateAsync({ id: admission.id, data: { status: prevStatus } }));
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  // Cancelling hard-requires a non-empty trimmed `reason` server-side.
  const handleCancelConfirm = async (reason: string) => {
    try {
      await nav.withLoading(async () =>
        advance.mutateAsync({ id: admission.id, data: { status: ADMISSION_STATUS.CANCELLED, reason } }),
      );
      setShowCancelModal(false);
    } catch {
      /* interceptor toasts */
    }
  };

  const medicalExamIndex = ADMISSION_STATUS_CHAIN.indexOf(ADMISSION_STATUS.MEDICAL_EXAM);
  // ADMISSION exam linked to this collaborator (auto-created by the server when
  // the process enters the medical-exam step; this also covers legacy data).
  const { exam: admissionExam, isLoading: isExamLoading } = useLinkedMedicalExam(admission.userId, MEDICAL_EXAM_TYPE.ADMISSION);
  const reachedMedicalStep = !isCancelled && currentIndex >= medicalExamIndex;
  const showExamSection = reachedMedicalStep || !!admissionExam;
  const isExamFitAndCompleted =
    admissionExam?.status === MEDICAL_EXAM_STATUS.COMPLETED && admissionExam?.result === MEDICAL_EXAM_RESULT.FIT;
  const awaitingExam = admission.status === ADMISSION_STATUS.MEDICAL_EXAM && !isExamLoading && !isExamFitAndCompleted;

  const handleScheduleExam = () => {
    if (!admission.userId) return;
    Alert.alert(
      "Agendar exame admissional",
      "Criar um exame admissional (ASO) agendado para este colaborador?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Agendar",
          onPress: async () => {
            try {
              const res = await nav.withLoading(async () =>
                createAsync({
                  userId: admission.userId,
                  type: MEDICAL_EXAM_TYPE.ADMISSION,
                  status: MEDICAL_EXAM_STATUS.SCHEDULED,
                  admissionId: admission.id,
                } as any),
              );
              const newId = (res as any)?.data?.id;
              if (newId) {
                nav.push(mobileRoute(routes.humanResources.occupationalHealth.medicalExams.details(newId)));
              }
            } catch {
              /* interceptor toasts */
            }
          },
        },
      ],
    );
  };

  return (
    <DetailCard
      title="Andamento da Admissão"
      icon="clipboard-check"
      badge={
        <Badge variant={getBadgeVariantFromStatus(admission.status, "ADMISSION")} size="sm">
          {ADMISSION_STATUS_LABELS[admission.status as ADMISSION_STATUS] || admission.status}
        </Badge>
      }
    >
      {isCancelled ? (
        <View style={[styles.banner, { borderColor: "#ef4444", backgroundColor: colors.muted }]}>
          <IconBan size={20} color="#ef4444" />
          <View style={styles.bannerTextWrap}>
            <ThemedText style={[styles.bannerTitle, { color: "#ef4444" }]}>Admissão cancelada</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: colors.mutedForeground }]}>
              Este processo foi cancelado e não pode mais ser avançado.
            </ThemedText>
          </View>
        </View>
      ) : (
        <View style={styles.stepper}>
          {STEPPER_STEPS.map((step, index) => {
            const isDone = index < stepperIndex || admission.status === ADMISSION_STATUS.COMPLETED;
            const isCurrent = index === stepperIndex && admission.status !== ADMISSION_STATUS.COMPLETED;
            const isLast = index === STEPPER_STEPS.length - 1;
            const circleColor = isDone ? colors.primary : isCurrent ? colors.primary : colors.border;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View
                    style={[
                      styles.circle,
                      {
                        borderColor: circleColor,
                        backgroundColor: isDone ? colors.primary : colors.background,
                      },
                    ]}
                  >
                    {isDone ? (
                      <IconCheck size={14} color={colors.primaryForeground ?? "#ffffff"} />
                    ) : (
                      <ThemedText style={[styles.circleText, { color: isCurrent ? colors.primary : colors.mutedForeground }]}>
                        {index + 1}
                      </ThemedText>
                    )}
                  </View>
                  {!isLast && <View style={[styles.connector, { backgroundColor: isDone ? colors.primary : colors.border }]} />}
                </View>
                <ThemedText
                  style={[
                    styles.stepLabel,
                    { color: isCurrent ? colors.foreground : isDone ? colors.foreground : colors.mutedForeground },
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      )}

      {/* ADMISSION exam (ASO) linked to the medical step */}
      {!isCancelled && showExamSection && (
        <View style={[styles.examSection, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <View style={styles.row}>
            <IconStethoscope size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.examTitle, { color: colors.foreground }]}>Exame Admissional (ASO)</ThemedText>
          </View>
          <LinkedExamStatus
            userId={admission.userId}
            type={MEDICAL_EXAM_TYPE.ADMISSION}
            emptyText="Nenhum exame admissional encontrado."
          />
          {canManage && !admissionExam && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleScheduleExam}
              icon={<Icon name="calendar-plus" size={16} color={colors.foreground} />}
            >
              Agendar exame
            </Button>
          )}
        </View>
      )}

      {/* Guard: leaving the medical step requires a COMPLETED + FIT exam */}
      {awaitingExam && (
        <View style={[styles.banner, { borderColor: "#d97706", backgroundColor: colors.muted, marginTop: spacing.sm }]}>
          <IconAlertTriangle size={20} color="#d97706" />
          <View style={styles.bannerTextWrap}>
            <ThemedText style={[styles.bannerTitle, { color: colors.foreground }]}>Aguardando ASO admissional</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: colors.mutedForeground }]}>
              O exame admissional precisa ser concluído com resultado Apto para avançar para o contrato.
            </ThemedText>
          </View>
        </View>
      )}

      {blockedByDocs && (
        <View style={[styles.banner, { borderColor: "#d97706", backgroundColor: colors.muted, marginTop: spacing.sm }]}>
          <IconAlertTriangle size={20} color="#d97706" />
          <View style={styles.bannerTextWrap}>
            <ThemedText style={[styles.bannerTitle, { color: colors.foreground }]}>Existem documentos obrigatórios pendentes</ThemedText>
            <ThemedText style={[styles.bannerBody, { color: colors.mutedForeground }]}>
              Receba, assine ou dispense os documentos obrigatórios para avançar a etapa.
            </ThemedText>
          </View>
        </View>
      )}

      {canManage && !isTerminal && (
        <View style={styles.actions}>
          {nextStatus && (
            <Button
              variant="default"
              loading={advance.isPending}
              disabled={blockedByDocs || awaitingExam}
              onPress={handleAdvance}
              icon={<Icon name="arrow-right" size={16} color={colors.primaryForeground ?? "#fff"} />}
            >
              {`Avançar para ${ADMISSION_STATUS_LABELS[nextStatus]}`}
            </Button>
          )}
          {prevStatus && (
            <Button
              variant="outline"
              loading={advance.isPending}
              onPress={handleRegress}
              icon={<Icon name="arrow-left" size={16} color={colors.foreground} />}
            >
              {`Voltar para ${ADMISSION_STATUS_LABELS[prevStatus]}`}
            </Button>
          )}
          <Button variant="outline" disabled={advance.isPending} onPress={() => setShowCancelModal(true)}>
            Cancelar Admissão
          </Button>
        </View>
      )}

      <CancelReasonModal
        visible={showCancelModal}
        title="Cancelar Admissão"
        description={`A admissão${admission.user?.name ? ` de "${admission.user.name}"` : ""} será marcada como cancelada e não poderá mais ser avançada. Informe o motivo de não ter sido concluída.`}
        confirmLabel="Cancelar Admissão"
        loading={advance.isPending}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelConfirm}
      />
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  stepper: { gap: 0 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  stepIndicatorColumn: { alignItems: "center", width: 28 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  circleText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  connector: { width: 2, flex: 1, minHeight: 18 },
  stepLabel: { fontSize: fontSize.sm, paddingTop: 4, paddingBottom: spacing.sm, flex: 1 },
  stepLabelCurrent: { fontWeight: fontWeight.semibold },
  examSection: { gap: spacing.sm, borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  examTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bannerTextWrap: { flex: 1, gap: 2 },
  bannerTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  bannerBody: { fontSize: fontSize.xs },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
