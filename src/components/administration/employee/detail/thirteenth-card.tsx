// 13º Salário — mirrors web CollaboratorThirteenthCard.
// SALARY-SENSITIVE: gated behind canViewPrices AND the DP privilege set
// (ACCOUNTING/HR/ADMIN). Self-hides when there are no records.

import { View, StyleSheet } from "react-native";

import type { Thirteenth } from "@/types";
import { THIRTEENTH_STATUS, THIRTEENTH_STATUS_LABELS, SECTOR_PRIVILEGES } from "@/constants";
import type { BadgeProps } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/number";
import { formatDate } from "@/utils";
import { useThirteenths } from "@/hooks/useThirteenth";
import { usePrivileges } from "@/hooks/usePrivileges";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

interface ThirteenthCardProps {
  userId: string;
}

const STATUS_BADGE: Record<string, BadgeProps["variant"]> = {
  [THIRTEENTH_STATUS.OPEN]: "warning",
  [THIRTEENTH_STATUS.FIRST_PAID]: "blue",
  [THIRTEENTH_STATUS.SECOND_PAID]: "blue",
  [THIRTEENTH_STATUS.PAID]: "success",
  [THIRTEENTH_STATUS.CANCELLED]: "secondary",
};

export function ThirteenthCard({ userId }: ThirteenthCardProps) {
  const { colors } = useTheme();
  const { canViewPrices, hasAnyPrivilegeAccess } = usePrivileges();
  const canView =
    canViewPrices &&
    hasAnyPrivilegeAccess([SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN]);

  const { data, isLoading } = useThirteenths(
    { where: { userId }, orderBy: { year: "desc" }, limit: 20 } as any,
    { enabled: !!userId && canView },
  );

  const records: Thirteenth[] = (data as any)?.data ?? [];

  if (!canView || isLoading || records.length === 0) return null;

  return (
    <DetailCard title="13º Salário" icon="currency-dollar">
      <View style={styles.list}>
        {records.map((record) => (
          <View key={record.id} style={[styles.row, { borderColor: colors.border }]}>
            <View style={styles.headerRow}>
              <ThemedText style={[styles.year, { color: colors.foreground }]}>{record.year}</ThemedText>
              <Badge variant={STATUS_BADGE[record.status] ?? "secondary"} size="sm">
                {THIRTEENTH_STATUS_LABELS[record.status] ?? record.status}
              </Badge>
            </View>
            {record.firstInstallment != null && (
              <View style={styles.metaRow}>
                <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
                  1ª parcela{record.firstInstallmentDate ? ` (${formatDate(record.firstInstallmentDate)})` : ""}
                </ThemedText>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatCurrency(record.firstInstallment)}
                </ThemedText>
              </View>
            )}
            {record.secondInstallment != null && (
              <View style={styles.metaRow}>
                <ThemedText style={[styles.meta, { color: colors.mutedForeground }]}>
                  2ª parcela{record.secondInstallmentDate ? ` (${formatDate(record.secondInstallmentDate)})` : ""}
                </ThemedText>
                <ThemedText style={[styles.value, { color: colors.foreground }]}>
                  {formatCurrency(record.secondInstallment)}
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
  year: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  meta: { fontSize: fontSize.sm, flex: 1 },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
