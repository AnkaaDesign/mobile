
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import type { PpeSize } from '../../../../../types';
import { USER_STATUS_LABELS } from "@/constants";
import { formatCPF } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";

interface EmployeeCardProps {
  ppeSize: PpeSize;
}

export function EmployeeCard({ ppeSize }: EmployeeCardProps) {
  const { colors } = useTheme();

  if (!ppeSize.user) {
    return null;
  }

  const user = ppeSize.user;

  return (
    <DetailCard title="Informações do Funcionário" icon="user">
      {/* Name and Status */}
      <View style={styles.employeeHeader}>
        <View style={styles.nameSection}>
          <ThemedText style={StyleSheet.flatten([styles.employeeName, { color: colors.foreground }])}>{user.name}</ThemedText>
          {user.status && (
            <Badge variant={user.status !== "DISMISSED" ? "success" : "secondary"}>
              <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{USER_STATUS_LABELS[user.status]}</ThemedText>
            </Badge>
          )}
        </View>
        {user.email && <ThemedText style={StyleSheet.flatten([styles.employeeEmail, { color: colors.mutedForeground }])}>{user.email}</ThemedText>}
      </View>

      {/* Employee Details */}
      {user.cpf && (
        <DetailField label="CPF" icon="id" value={formatCPF(user.cpf)} />
      )}

      {user.position && (
        <DetailField label="Cargo" icon="briefcase" value={user.position.name} />
      )}

      {user.sector && (
        <DetailField label="Setor" icon="building" value={user.sector.name} />
      )}

      {user.pis && (
        <DetailField label="PIS" icon="id" value={user.pis} />
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  employeeHeader: {
    gap: spacing.sm,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  employeeName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  employeeEmail: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
