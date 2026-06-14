import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import type { Termination } from "@/types";
import {
  TERMINATION_TYPE_LABELS,
  TERMINATION_STATUS_LABELS,
  NOTICE_TYPE_LABELS,
  NOTICE_REDUCTION_LABELS,
} from "@/constants/enum-labels";
import { NOTICE_REDUCTION } from "@/constants";
import { formatDate } from "@/utils/date";
import { formatCurrency } from "@/utils/number";

interface Props {
  termination: Termination;
}

export function TerminationSummaryCard({ termination: t }: Props) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Resumo da Rescisão" icon="user-minus">
      <View style={styles.content}>
        <DetailSection title="Colaborador">
          <DetailField
            label="Colaborador"
            icon="user"
            value={
              <View>
                <ThemedText style={{ color: colors.foreground, fontWeight: "600" }}>
                  {t.user?.name || "—"}
                </ThemedText>
                {t.user?.position && (
                  <ThemedText style={{ color: colors.mutedForeground, fontSize: 13 }}>
                    {(t.user as any).position?.name}
                  </ThemedText>
                )}
              </View>
            }
          />
        </DetailSection>

        <DetailSection title="Modalidade e Status">
          <DetailField
            label="Modalidade"
            value={
              <Badge variant="outline">
                <ThemedText style={styles.badge}>
                  {t.type ? TERMINATION_TYPE_LABELS[t.type] : "—"}
                </ThemedText>
              </Badge>
            }
          />
          <DetailField
            label="Status"
            value={
              <Badge variant="secondary">
                <ThemedText style={styles.badge}>
                  {t.status ? TERMINATION_STATUS_LABELS[t.status] : "—"}
                </ThemedText>
              </Badge>
            }
          />
          {t.justCauseArticle ? (
            <DetailField label="Artigo (Justa Causa)" value={t.justCauseArticle} />
          ) : null}
        </DetailSection>

        <DetailSection title="Datas">
          <DetailField label="Data da Rescisão" icon="calendar" value={formatDate(t.terminationDate)} />
          <DetailField label="Último Dia Trabalhado" value={formatDate(t.lastWorkingDate)} />
          <DetailField label="Vencimento do Pagamento" value={formatDate(t.paymentDueDate)} />
          <DetailField label="Data do Pagamento" value={formatDate(t.paymentDate)} />
        </DetailSection>

        {t.noticeType ? (
          <DetailSection title="Aviso Prévio">
            <DetailField label="Tipo" value={NOTICE_TYPE_LABELS[t.noticeType]} />
            <DetailField
              label="Redução"
              value={NOTICE_REDUCTION_LABELS[t.noticeReduction ?? NOTICE_REDUCTION.NONE]}
            />
            <DetailField label="Dias" value={t.noticeDays != null ? String(t.noticeDays) : "—"} />
            <DetailField label="Início" value={formatDate(t.noticeStartDate)} />
          </DetailSection>
        ) : null}

        <DetailSection title="Bases e Valores">
          <DetailField
            label="Remuneração Base"
            value={t.baseRemuneration != null ? formatCurrency(t.baseRemuneration) : "—"}
          />
          <DetailField
            label="Saldo de FGTS"
            value={t.fgtsBalance != null ? formatCurrency(t.fgtsBalance) : "—"}
          />
          <DetailField label="Períodos de Férias Vencidas" value={String(t.accruedVacationPeriods ?? 0)} />
          <DetailField
            label="Valor Líquido Pago"
            value={
              <ThemedText style={{ color: colors.primary, fontWeight: "700" }}>
                {t.paidAmount != null ? formatCurrency(t.paidAmount) : "—"}
              </ThemedText>
            }
          />
        </DetailSection>

        {t.reason ? (
          <DetailSection title="Motivo">
            <ThemedText style={{ color: colors.foreground }}>{t.reason}</ThemedText>
          </DetailSection>
        ) : null}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 },
  badge: { fontSize: 12 },
});
