
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { DetailCard, DetailField, DetailSection } from "@/components/ui/detail-page-layout";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUsers } from "@tabler/icons-react-native";
import type { Warning } from '../../../../types';
import { WARNING_CATEGORY_LABELS } from "@/constants";
import { formatDate, formatDateTime } from "@/utils";

interface WarningDetailsCardProps {
  warning: Warning;
}

export function WarningDetailsCard({ warning }: WarningDetailsCardProps) {
  const { colors } = useTheme();

  return (
    <DetailCard title="Detalhes e Datas" icon="category">
      <View style={styles.content}>
        {/* Category Section */}
        <DetailSection title="Categoria">
          <DetailField
            label="Tipo de Advertência"
            value={
              <Badge variant="outline">
                <ThemedText style={styles.badgeText}>
                  {WARNING_CATEGORY_LABELS[warning.category]}
                </ThemedText>
              </Badge>
            }
          />
        </DetailSection>

        {/* Issued By Section */}
        <DetailSection title="Emitida Por">
          <DetailField
            label="Supervisor"
            icon="shield"
            value={
              <View style={styles.personInfo}>
                <ThemedText style={StyleSheet.flatten([styles.personName, { color: colors.foreground }])}>
                  {warning.supervisor?.name || "-"}
                </ThemedText>
                {warning.supervisor?.position && (
                  <ThemedText style={StyleSheet.flatten([styles.personPosition, { color: colors.mutedForeground }])}>
                    {warning.supervisor.position.name}
                  </ThemedText>
                )}
              </View>
            }
          />
        </DetailSection>

        {/* Witnesses Section */}
        {warning.witness && warning.witness.length > 0 && (
          <DetailSection title="Testemunhas">
            <View style={StyleSheet.flatten([styles.witnessBox, { backgroundColor: colors.muted + "30" }])}>
              <View style={styles.witnessHeader}>
                <IconUsers size={16} color={colors.mutedForeground} />
                <ThemedText style={StyleSheet.flatten([styles.witnessCount, { color: colors.mutedForeground }])}>
                  {warning.witness.length} pessoa{warning.witness.length !== 1 ? 's' : ''}
                </ThemedText>
              </View>
              <View style={styles.witnessContainer}>
                {warning.witness.map((w: any) => (
                  <View key={w.id} style={styles.witnessItem}>
                    <View style={StyleSheet.flatten([styles.witnessDot, { backgroundColor: colors.primary }])} />
                    <ThemedText style={StyleSheet.flatten([styles.witnessText, { color: colors.foreground }])}>
                      {w.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </DetailSection>
        )}

        {/* Dates Section */}
        <DetailSection title="Datas Importantes">
          <DetailField label="Acompanhamento" value={formatDate(warning.followUpDate)} icon="calendar" />
          <DetailField label="Criada em" value={formatDateTime(warning.createdAt)} />
          <DetailField label="Atualizada em" value={formatDateTime(warning.updatedAt)} />
        </DetailSection>
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  personInfo: {
    alignItems: "flex-end",
  },
  personName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  personPosition: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  witnessBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  witnessHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  witnessCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  witnessContainer: {
    gap: spacing.sm,
  },
  witnessItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  witnessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  witnessText: {
    fontSize: fontSize.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
