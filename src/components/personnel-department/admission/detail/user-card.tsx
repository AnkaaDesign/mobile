// user-card.tsx (mobile) — "Colaborador".
// Identity + professional summary of the admission's collaborator.

import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatCPF } from "@/utils/formatters";
import { EMPLOYEE_TYPE_LABELS } from "@/constants/enum-labels";
import type { Admission } from "@/types/admission";

interface UserCardProps {
  admission: Admission;
}

export function UserCard({ admission }: UserCardProps) {
  const { colors } = useTheme();
  const user = admission.user;

  if (!user) {
    return (
      <DetailCard title="Colaborador" icon="user">
        <ThemedText style={[styles.muted, { color: colors.mutedForeground }]}>Colaborador não carregado.</ThemedText>
      </DetailCard>
    );
  }

  const employeeType = user.currentEmployeeType;

  return (
    <DetailCard title="Colaborador" icon="user">
      <View style={styles.fields}>
        <DetailField label="Nome" value={user.name} icon="user" />
        {user.cpf ? <DetailField label="CPF" value={formatCPF(user.cpf)} icon="id" monospace /> : null}
        {user.email ? <DetailField label="E-mail" value={user.email} icon="mail" /> : null}
        {user.position?.name ? <DetailField label="Cargo" value={user.position.name} icon="briefcase" /> : null}
        {user.sector?.name ? <DetailField label="Setor" value={user.sector.name} icon="building" /> : null}
        {employeeType ? <DetailField label="Categoria" value={EMPLOYEE_TYPE_LABELS[employeeType] || employeeType} icon="user-check" /> : null}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.sm },
  muted: { fontSize: fontSize.sm },
});
