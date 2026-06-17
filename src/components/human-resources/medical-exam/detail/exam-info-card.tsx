import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { MedicalExam } from "@/types";
import {
  MEDICAL_EXAM_TYPE_LABELS,
  MEDICAL_EXAM_STATUS_LABELS,
  MEDICAL_EXAM_RESULT_LABELS,
  MEDICAL_EXAM_STATUS,
  MEDICAL_EXAM_RESULT,
  MEDICAL_EXAM_TYPE,
} from "@/constants";
import { formatDate, formatDateTime } from "@/utils";

interface ExamInfoCardProps {
  exam: MedicalExam;
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

export function ExamInfoCard({ exam }: ExamInfoCardProps) {
  const isPeriodic = exam.type === MEDICAL_EXAM_TYPE.PERIODIC;

  return (
    <DetailCard title="Detalhes do Exame" icon="clipboard-check">
      <View style={styles.content}>
        <DetailSection title="Classificação">
          <DetailField
            label="Tipo"
            value={
              <Badge variant="primary">
                <ThemedText style={styles.badgeText}>
                  {exam.type ? MEDICAL_EXAM_TYPE_LABELS[exam.type] : "—"}
                </ThemedText>
              </Badge>
            }
          />
          <DetailField
            label="Status"
            value={
              <Badge variant={statusVariant(exam.status) as any}>
                <ThemedText style={styles.badgeText}>
                  {exam.status ? MEDICAL_EXAM_STATUS_LABELS[exam.status] : "—"}
                </ThemedText>
              </Badge>
            }
          />
          <DetailField
            label="Resultado"
            value={
              <Badge variant={resultVariant(exam.result) as any}>
                <ThemedText style={styles.badgeText}>
                  {exam.result ? MEDICAL_EXAM_RESULT_LABELS[exam.result] : "—"}
                </ThemedText>
              </Badge>
            }
          />
        </DetailSection>

        {exam.result === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS && exam.restrictions ? (
          <DetailSection title="Restrições">
            <DetailField label="Descrição" value={exam.restrictions} icon="alert-triangle" />
          </DetailSection>
        ) : null}

        {isPeriodic && exam.periodicityMonths ? (
          <DetailSection title="Periodicidade">
            <DetailField
              label="Próximo exame"
              value={`A cada ${exam.periodicityMonths} ${exam.periodicityMonths === 1 ? "mês" : "meses"}`}
              icon="repeat"
            />
          </DetailSection>
        ) : null}

        <DetailSection title="Datas">
          <DetailField label="Agendamento" value={exam.scheduledAt ? formatDate(exam.scheduledAt) : "—"} icon="calendar" />
          <DetailField label="Data do Exame" value={exam.examDate ? formatDate(exam.examDate) : "—"} icon="calendar-check" />
          <DetailField label="Validade" value={exam.expiresAt ? formatDate(exam.expiresAt) : "—"} icon="calendar-clock" />
          <DetailField label="Criado em" value={formatDateTime(exam.createdAt)} />
          <DetailField label="Atualizado em" value={formatDateTime(exam.updatedAt)} />
        </DetailSection>

        {(exam.physicianName || exam.crm || exam.clinic) && (
          <DetailSection title="Médico e Clínica">
            {exam.physicianName ? <DetailField label="Médico" value={exam.physicianName} icon="stethoscope" /> : null}
            {exam.crm ? <DetailField label="CRM" value={exam.crm} /> : null}
            {exam.clinic ? <DetailField label="Clínica" value={exam.clinic} icon="building-hospital" /> : null}
          </DetailSection>
        )}

        {exam.notes ? (
          <DetailSection title="Observações">
            <DetailField label="Notas" value={exam.notes} />
          </DetailSection>
        ) : null}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
