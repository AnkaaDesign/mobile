// Benefícios Ativos — mirrors web UserBenefitsCard.
// SALARY-SENSITIVE: gated behind canViewPrices (hides monetary info from
// WAREHOUSE) AND the DP privilege set (ACCOUNTING/HR/ADMIN). Self-hides when the
// collaborator has no ACTIVE enrollments.

import { View, StyleSheet } from "react-native";

import type { UserBenefit } from "@/types";
import { BENEFIT_ENROLLMENT_STATUS, SECTOR_PRIVILEGES } from "@/constants";
import { formatCurrency } from "@/utils/number";
import { useUserBenefits } from "@/hooks/useUserBenefit";
import { usePrivileges } from "@/hooks/usePrivileges";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface BenefitsCardProps {
  userId: string;
}

export function BenefitsCard({ userId }: BenefitsCardProps) {
  const { colors } = useTheme();
  const { canViewPrices, hasAnyPrivilegeAccess } = usePrivileges();
  const canView =
    canViewPrices &&
    hasAnyPrivilegeAccess([SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]);

  const { data, isLoading } = useUserBenefits(
    {
      userIds: [userId],
      statuses: [BENEFIT_ENROLLMENT_STATUS.ACTIVE],
      include: { benefit: true },
      orderBy: { createdAt: "asc" },
      limit: 50,
    } as any,
    { enabled: !!userId && canView },
  );

  const enrollments: UserBenefit[] = data?.data ?? [];

  if (!canView || isLoading || enrollments.length === 0) return null;

  return (
    <DetailCard title="Benefícios Ativos" icon="coins">
      <View style={styles.list}>
        {enrollments.map((enrollment) => (
          <View key={enrollment.id} style={[styles.row, { borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <ThemedText style={[styles.name, { color: colors.foreground }]}>
                {enrollment.benefit?.name ?? "Benefício"}
              </ThemedText>
              <Badge variant="success" size="sm">
                Ativo
              </Badge>
            </View>
            <View style={styles.metaRow}>
              <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>Valor mensal</ThemedText>
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {formatCurrency(enrollment.monthlyValue ?? 0)}
              </ThemedText>
            </View>
            {enrollment.employeeDiscountValue != null && enrollment.employeeDiscountValue > 0 && (
              <View style={styles.metaRow}>
                <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>Desconto colaborador</ThemedText>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatCurrency(enrollment.employeeDiscountValue)}
                </ThemedText>
              </View>
            )}
            {enrollment.totalInstallments != null && (
              <View style={styles.metaRow}>
                <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>Parcela</ThemedText>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {`${enrollment.currentInstallment ?? 0}/${enrollment.totalInstallments}`}
                </ThemedText>
              </View>
            )}
          </View>
        ))}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: { borderWidth: 1, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meta: { fontSize: fontSize.sm },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
