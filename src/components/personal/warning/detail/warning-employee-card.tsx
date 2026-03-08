
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { formatBrazilianPhone } from "@/utils";

interface WarningEmployeeCardProps {
  warning: Warning;
}

export function WarningEmployeeCard({ warning }: WarningEmployeeCardProps) {
  const { colors } = useTheme();

  const employee = warning.collaborator;

  if (!employee) {
    return (
      <DetailCard title="Colaborador" icon="user">
        <View style={styles.emptyState}>
          <View style={StyleSheet.flatten([styles.emptyIcon, { backgroundColor: colors.muted + "30" }])}>
            <IconUser size={32} color={colors.mutedForeground} />
          </View>
          <ThemedText style={StyleSheet.flatten([styles.emptyTitle, { color: colors.foreground }])}>
            Colaborador não encontrado
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.emptyDescription, { color: colors.mutedForeground }])}>
            As informações do colaborador não estão disponíveis.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Colaborador" icon="user">
      <View style={styles.content}>
        <DetailSection title="Identificação">
          <DetailField label="Nome Completo" value={employee.name} />

          {employee.position && (
            <DetailField label="Cargo" value={employee.position.name} icon="briefcase" />
          )}

          {employee.id && (
            <DetailField label="ID" value={employee.id} monospace />
          )}
        </DetailSection>

        {/* Contact Information Section */}
        {(employee.email || employee.phone) && (
          <DetailSection title="Contato">
            {employee.email && (
              <DetailField label="E-mail" value={employee.email} icon="mail" />
            )}

            {employee.phone && (
              <DetailField label="Telefone" value={formatBrazilianPhone(employee.phone)} icon="phone" />
            )}
          </DetailSection>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
});
