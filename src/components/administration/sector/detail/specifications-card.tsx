
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconInfoCircle, IconCalendar } from "@tabler/icons-react-native";
import type { Sector } from '../../../../types';
import { SECTOR_PRIVILEGES_LABELS, SECTOR_PRIVILEGES } from "@/constants";
import { formatDateTime } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

// Map privileges to badge colors (same as web list page)
const getPrivilegeColor = (privilege: string) => {
  switch (privilege) {
    case SECTOR_PRIVILEGES.ADMIN:
      return "destructive"; // Red - highest privilege
    case SECTOR_PRIVILEGES.LEADER:
      return "warning"; // Yellow/Orange - leadership role
    case SECTOR_PRIVILEGES.HUMAN_RESOURCES:
      return "purple"; // Purple - HR specific
    case SECTOR_PRIVILEGES.PRODUCTION:
      return "blue"; // Blue - production role
    case SECTOR_PRIVILEGES.MAINTENANCE:
      return "orange"; // Orange - maintenance role
    case SECTOR_PRIVILEGES.WAREHOUSE:
      return "green"; // Green - warehouse role
    case SECTOR_PRIVILEGES.FINANCIAL:
      return "green"; // Green - financial role
    case SECTOR_PRIVILEGES.EXTERNAL:
      return "secondary"; // Gray - external access
    case SECTOR_PRIVILEGES.BASIC:
    default:
      return "default"; // Default gray - basic access
  }
};

interface SpecificationsCardProps {
  sector: Sector;
}

export function SpecificationsCard({ sector }: SpecificationsCardProps) {
  const { colors } = useTheme();

  // Get the manager from managedByUsers relation (first user if multiple)
  const manager = sector.managedByUsers && sector.managedByUsers.length > 0 ? sector.managedByUsers[0] : null;

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconInfoCircle size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Especificações</ThemedText>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <ThemedText style={[styles.subsectionTitle, { color: colors.mutedForeground }]}>
          Informações Básicas
        </ThemedText>
        <View style={styles.infoGrid}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Nome
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {sector.name}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Privilégios
            </ThemedText>
            <Badge variant={getPrivilegeColor(sector.privileges) as any}>
              <ThemedText style={{ fontSize: fontSize.xs }}>
                {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
              </ThemedText>
            </Badge>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Usuários
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {sector._count?.users || 0} usuário{(sector._count?.users || 0) !== 1 ? "s" : ""}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Tarefas
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {sector._count?.tasks || 0} tarefa{(sector._count?.tasks || 0) !== 1 ? "s" : ""}
            </ThemedText>
          </View>

          {manager && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Administrador
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                {manager.name}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* System Dates */}
      <View style={styles.section}>
        <View style={styles.subsectionHeader}>
          <IconCalendar size={16} color={colors.mutedForeground} />
          <ThemedText style={[styles.subsectionTitle, { color: colors.mutedForeground }]}>
            Datas do Sistema
          </ThemedText>
        </View>
        <View style={styles.infoGrid}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Criado em
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {sector.createdAt ? formatDateTime(sector.createdAt) : "-"}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Atualizado em
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: colors.foreground }]}>
              {sector.updatedAt ? formatDateTime(sector.updatedAt) : "-"}
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  section: {
    marginBottom: spacing.lg,
  },
  subsectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  subsectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  infoGrid: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    textAlign: "right",
    flexShrink: 1,
  },
});
