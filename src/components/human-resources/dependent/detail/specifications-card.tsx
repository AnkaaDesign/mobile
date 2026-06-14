import { View, StyleSheet } from "react-native";
import type { Dependent } from "@/types";
import { DEPENDENT_RELATIONSHIP_LABELS } from "@/constants/enum-labels";
import { formatCPF, formatCurrency, formatDate, formatDateTime } from "@/utils";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";

interface SpecificationsCardProps {
  dependent: Dependent;
}

function computeAge(birthDate: Date | string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function SpecificationsCard({ dependent }: SpecificationsCardProps) {
  const { colors } = useTheme();
  const age = computeAge(dependent.birthDate);

  return (
    <DetailCard title="Especificações" icon="info-circle">
      {/* Basic Information */}
      <DetailSection title="Informações Básicas">
        <DetailField
          label="Nome"
          icon="user"
          value={
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {dependent.name || "-"}
            </ThemedText>
          }
        />
        <DetailField
          label="Parentesco"
          icon="users"
          value={
            <Badge variant="secondary">
              <ThemedText style={styles.badgeText}>
                {DEPENDENT_RELATIONSHIP_LABELS[dependent.relationship] || dependent.relationship}
              </ThemedText>
            </Badge>
          }
        />
        {dependent.cpf && <DetailField label="CPF" icon="id" value={formatCPF(dependent.cpf)} />}
        <DetailField
          label="Data de Nascimento"
          icon="cake"
          value={age != null ? `${formatDate(dependent.birthDate)} (${age} anos)` : formatDate(dependent.birthDate)}
        />
      </DetailSection>

      {/* Eligibility */}
      <DetailSection title="Elegibilidade">
        <DetailField
          label="Dedução IRRF"
          icon="receipt-tax"
          value={
            <Badge variant={dependent.irrfDeduction ? "success" : "outline"}>
              <ThemedText style={styles.badgeText}>
                {dependent.irrfDeduction ? "Sim" : "Não"}
              </ThemedText>
            </Badge>
          }
        />
        <DetailField
          label="Salário-Família"
          icon="coin"
          value={
            <Badge variant={dependent.salarioFamilia ? "success" : "outline"}>
              <ThemedText style={styles.badgeText}>
                {dependent.salarioFamilia ? "Sim" : "Não"}
              </ThemedText>
            </Badge>
          }
        />
      </DetailSection>

      {/* Health Plan */}
      <DetailSection title="Plano de Saúde">
        <DetailField
          label="Inscrito"
          icon="heart-handshake"
          value={
            <Badge variant={dependent.healthPlanBenefitId ? "success" : "outline"}>
              <ThemedText style={styles.badgeText}>
                {dependent.healthPlanBenefitId ? "Sim" : "Não"}
              </ThemedText>
            </Badge>
          }
        />
        {dependent.healthPlanValue != null && (
          <DetailField
            label="Custo do dependente"
            icon="currency-real"
            value={formatCurrency(dependent.healthPlanValue)}
          />
        )}
      </DetailSection>

      {/* Notes */}
      {dependent.notes ? (
        <DetailSection title="Observações">
          <DetailField
            label="Observações"
            icon="notes"
            value={
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {dependent.notes}
              </ThemedText>
            }
          />
        </DetailSection>
      ) : null}

      {/* Dates */}
      <DetailSection title="Datas">
        <DetailField label="Criado em" icon="calendar" value={formatDateTime(dependent.createdAt)} />
        <DetailField label="Atualizado em" icon="clock" value={formatDateTime(dependent.updatedAt)} />
      </DetailSection>

      {/* Identification */}
      <DetailSection title="Identificação">
        <DetailField label="ID do Dependente" icon="hash" value={dependent.id} monospace />
      </DetailSection>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
