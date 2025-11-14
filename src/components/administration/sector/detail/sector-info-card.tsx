
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconInfoCircle, IconShieldCheck, IconCalendar } from "@tabler/icons-react-native";
import type { Sector } from '../../../../types';
import { SECTOR_PRIVILEGES_LABELS } from "@/constants";
import { formatDate } from "@/utils";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface SectorInfoCardProps {
  sector: Sector & {
    _count?: {
      users?: number;
      tasks?: number;
    };
    managedByUsers?: Array<{
      id: string;
      name: string;
      email: string;
    }>;
  };
}

export function SectorInfoCard({ sector }: SectorInfoCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <IconInfoCircle size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
      </View>

      <View style={styles.infoGrid}>
        {/* Privilege Level */}
        <View style={styles.detailRow}>
          <IconShieldCheck size={16} color={colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
            Privilégio
          </ThemedText>
          <Badge variant="default" style={styles.badge}>
            <ThemedText style={{ fontSize: fontSize.xs, color: colors.primaryForeground }}>
              {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
            </ThemedText>
          </Badge>
        </View>

        {/* Created At */}
        <View style={styles.detailRow}>
          <IconCalendar size={16} color={colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
            Criado em
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
            {formatDate(sector.createdAt)}
          </ThemedText>
        </View>

        {/* Updated At */}
        <View style={styles.detailRow}>
          <IconCalendar size={16} color={colors.mutedForeground} />
          <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
            Atualizado em
          </ThemedText>
          <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
            {formatDate(sector.updatedAt)}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  },
  badge: {
    marginLeft: "auto",
  },
});
