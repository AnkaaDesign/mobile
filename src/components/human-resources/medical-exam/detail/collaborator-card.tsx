import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import { IconUser } from "@tabler/icons-react-native";
import type { MedicalExam } from "@/types";

interface CollaboratorCardProps {
  exam: MedicalExam;
}

export function CollaboratorCard({ exam }: CollaboratorCardProps) {
  const { colors } = useTheme();
  const employee = exam.user as any;

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
});
