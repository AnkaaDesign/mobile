import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconAlertTriangle } from "@tabler/icons-react-native";

import type { UserBenefit } from "@/types";
import { BENEFIT_KIND, BENEFIT_KIND_LABELS, BENEFIT_ENROLLMENT_STATUS_LABELS, getBadgeVariant } from "@/constants";
import { formatCurrency, formatDate } from "@/utils";
import { getKindDiscountHelper } from "../discount-caps";
import { calculateBenefitSplit } from "@/utils/benefit-discount";
import { getPositionMonthlySalary } from "@/utils/overtime-cost";

interface CardProps {
  userBenefit: UserBenefit;
}

const formatPercent = (percentage: number): string => {
  const formatted = percentage.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${formatted}%`;
};

export function UserBenefitUserCard({ userBenefit }: CardProps) {
  const user = userBenefit.user;
  return (
    <DetailCard title="Colaborador" icon="user">
      <View style={styles.content}>
        <DetailField label="Nome" value={user?.name || "-"} icon="user" />
        <DetailField label="Cargo" value={user?.position?.name || "-"} icon="briefcase" />
        <DetailField label="Setor" value={user?.sector?.name || "-"} icon="building" />
      </View>
    </DetailCard>
  );
}

export function UserBenefitBenefitCard({ userBenefit }: CardProps) {
  const benefit = userBenefit.benefit;
  return (
    <DetailCard title="Benefício" icon="tag">
      <View style={styles.content}>
        <DetailField label="Nome" value={benefit?.name || "-"} icon="tag" />
        <DetailField
          label="Tipo"
          icon="category"
          value={
            benefit ? (
              <Badge variant="secondary">
                <ThemedText style={styles.badgeText}>{BENEFIT_KIND_LABELS[benefit.kind] || benefit.kind}</ThemedText>
              </Badge>
            ) : (
              "-"
            )
          }
        />
        <DetailField label="Fornecedor" value={benefit?.provider || "-"} icon="building" />
      </View>
    </DetailCard>
  );
}

export function UserBenefitValuesCard({ userBenefit }: CardProps) {
  const { colors } = useTheme();
  // Regra canônica (folha): VT percentual desconta % do SALÁRIO-BASE (limitado
  // ao custo do VT); demais tipos, % do custo.
  const baseSalary = getPositionMonthlySalary(userBenefit.user?.position);
  const split = calculateBenefitSplit(
    {
      monthlyValue: userBenefit.monthlyValue,
      employeeDiscountValue: userBenefit.employeeDiscountValue,
      employeeDiscountPercent: userBenefit.employeeDiscountPercent,
      benefitKind: userBenefit.benefit?.kind,
    },
    baseSalary,
  );
  const salaryKnown = !split.dependsOnSalary || baseSalary !== null;
  const isPercentRule =
    (userBenefit.employeeDiscountValue === null || userBenefit.employeeDiscountValue === undefined) &&
    userBenefit.employeeDiscountPercent !== null &&
    userBenefit.employeeDiscountPercent !== undefined;
  const kind = userBenefit.benefit?.kind;
  const showCapNote = kind === BENEFIT_KIND.TRANSPORT_VOUCHER || kind === BENEFIT_KIND.MEAL_VOUCHER || kind === BENEFIT_KIND.FOOD_VOUCHER;

  return (
    <DetailCard title="Valores e Descontos" icon="receipt">
      <View style={styles.content}>
        <DetailField label="Custo Total (Valor Mensal)" value={formatCurrency(split.monthlyValue)} icon="receipt" />
        <DetailField label="Empresa Paga" value={salaryKnown ? formatCurrency(split.companyShare) : "depende do salário"} />
        <DetailField
          label="Colaborador Paga"
          value={
            salaryKnown ? (
              <ThemedText style={[styles.valueInline, { color: colors.foreground }]}>
                {formatCurrency(split.employeeShare)}
                {isPercentRule ? (
                  <ThemedText style={[styles.valueNote, { color: colors.mutedForeground }]}>
                    {"  "}({formatPercent(userBenefit.employeeDiscountPercent!)} {split.dependsOnSalary ? "do salário" : "do custo"})
                  </ThemedText>
                ) : null}
              </ThemedText>
            ) : (
              "—"
            )
          }
        />
        {split.dependsOnSalary && (
          <DetailField label="Salário-Base (cálculo VT)" value={baseSalary !== null ? formatCurrency(baseSalary) : "não disponível"} />
        )}
        {userBenefit.benefit?.kind === BENEFIT_KIND.TRANSPORT_VOUCHER && (
          <DetailField label="Passagens por Dia" value={userBenefit.dailyTickets !== null && userBenefit.dailyTickets !== undefined ? String(userBenefit.dailyTickets) : "-"} icon="receipt" />
        )}
        {userBenefit.totalInstallments != null && (
          <DetailField label="Parcelas" value={`${userBenefit.currentInstallment ?? 1}/${userBenefit.totalInstallments}`} icon="list" />
        )}
        {showCapNote && (
          <ThemedText style={[styles.capNote, { color: colors.mutedForeground }]}>{getKindDiscountHelper(kind)}</ThemedText>
        )}
        {/* Guard de VT: o desconto depende do salário-base desconhecido/zero.
            NÃO exibimos R$ 0,00 como valor real — sinalizamos a pendência. */}
        {split.salaryUnknownWarning && (
          <View style={[styles.warningBox, { backgroundColor: colors.warning + "1A", borderColor: colors.warning + "66" }]}>
            <IconAlertTriangle size={16} color={colors.warning} style={styles.warningIcon} />
            <ThemedText style={[styles.warningText, { color: colors.warning }]}>
              O desconto do Vale Transporte é {formatPercent(userBenefit.employeeDiscountPercent!)} do salário-base, mas o salário deste colaborador não está
              cadastrado. O valor não foi zerado por engano — cadastre o salário do cargo para calcular o desconto correto.
            </ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

export function UserBenefitDatesCard({ userBenefit }: CardProps) {
  return (
    <DetailCard title="Vigência e Status" icon="calendar">
      <View style={styles.content}>
        <DetailField
          label="Status"
          value={
            <Badge variant={getBadgeVariant(userBenefit.status, "BENEFIT_ENROLLMENT")}>
              <ThemedText style={styles.badgeText}>
                {BENEFIT_ENROLLMENT_STATUS_LABELS[userBenefit.status] || userBenefit.status}
              </ThemedText>
            </Badge>
          }
        />
        <DetailField label="Data de Início" value={userBenefit.startDate ? formatDate(userBenefit.startDate) : "-"} icon="calendar" />
        <DetailField label="Data de Fim" value={userBenefit.endDate ? formatDate(userBenefit.endDate) : "—"} />
        <DetailField label="Criado em" value={userBenefit.createdAt ? formatDate(userBenefit.createdAt) : "-"} />
        {userBenefit.notes ? (
          <DetailSection title="Observações">
            <DetailField label="Observações" value={userBenefit.notes} />
          </DetailSection>
        ) : null}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  valueInline: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  valueNote: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
  capNote: {
    fontSize: fontSize.xs,
  },
  warningBox: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
});
