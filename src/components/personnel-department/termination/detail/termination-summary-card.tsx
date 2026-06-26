import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import type { Termination } from "@/types";
import {
  TERMINATION_TYPE_LABELS,
  TERMINATION_STATUS_LABELS,
  NOTICE_TYPE_LABELS,
  NOTICE_REDUCTION_LABELS,
} from "@/constants/enum-labels";
import { NOTICE_REDUCTION, TERMINATION_TYPE, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { formatDate } from "@/utils/date";
import { isPaymentOverdue } from "./termination-utils";

interface Props {
  termination: Termination;
}

export function TerminationSummaryCard({ termination: t }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  const overdue = isPaymentOverdue(t);

  return (
    <DetailCard title="Resumo" icon="user">
      <View style={styles.content}>
        {/* Colaborador (link para o detalhe do colaborador) */}
        <DetailField
          label="Colaborador"
          icon="user"
          value={
            t.user ? (
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    mobileRoute(routes.administration.collaborators.details(t.userId)) as any,
                  )
                }
              >
                <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>
                  {t.user.name}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              "—"
            )
          }
        />

        {(t.user as any)?.position?.name ? (
          <DetailField label="Cargo" value={(t.user as any).position.name} />
        ) : null}
        {(t.user as any)?.sector?.name ? (
          <DetailField label="Setor" value={(t.user as any).sector.name} />
        ) : null}

        <DetailField
          label="Tipo"
          value={
            <Badge variant="secondary">
              <ThemedText style={styles.badge}>
                {t.type ? TERMINATION_TYPE_LABELS[t.type] : "—"}
              </ThemedText>
            </Badge>
          }
        />

        <DetailField
          label="Status"
          value={
            <Badge variant={(t.status ? getBadgeVariantFromStatus(t.status, "TERMINATION") : "secondary") as any}>
              <ThemedText style={styles.badge}>
                {t.status ? TERMINATION_STATUS_LABELS[t.status] : "—"}
              </ThemedText>
            </Badge>
          }
        />

        <DetailField
          label="Aviso Prévio"
          value={t.noticeType ? NOTICE_TYPE_LABELS[t.noticeType] : "—"}
        />
        <DetailField
          label="Dias de Aviso"
          value={t.noticeDays != null ? String(t.noticeDays) : "—"}
        />
        {t.noticeReduction && t.noticeReduction !== NOTICE_REDUCTION.NONE ? (
          <DetailField
            label="Redução do Aviso"
            value={NOTICE_REDUCTION_LABELS[t.noticeReduction]}
          />
        ) : null}
        <DetailField label="Início do Aviso" value={formatDate(t.noticeStartDate)} />

        <DetailField label="Data da Rescisão" icon="calendar" value={formatDate(t.terminationDate)} />
        <DetailField label="Último Dia Trabalhado" value={formatDate(t.lastWorkingDate)} />
        <DetailField label="Projeção do Contrato" value={formatDate(t.projectedEndDate)} />

        <DetailField
          label="Prazo de Pagamento"
          value={
            t.paymentDueDate ? (
              <View style={styles.inlineRow}>
                <ThemedText
                  style={{ color: overdue ? colors.destructive : colors.foreground, fontWeight: overdue ? "600" : "400" }}
                >
                  {formatDate(t.paymentDueDate)}
                </ThemedText>
                {overdue ? (
                  <Badge variant="destructive" size="sm">
                    <ThemedText style={{ fontSize: 10, color: "#fff" }}>Atrasado</ThemedText>
                  </Badge>
                ) : null}
              </View>
            ) : (
              "—"
            )
          }
        />

        {t.type === TERMINATION_TYPE.WITH_CAUSE ? (
          <DetailField label="Artigo" value={t.justCauseArticle || "—"} />
        ) : null}

        {t.reason ? <DetailField label="Motivo" value={t.reason} /> : null}

        <DetailField label="Iniciada por" value={t.initiatedBy?.name || "—"} />
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  badge: { fontSize: 12 },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
