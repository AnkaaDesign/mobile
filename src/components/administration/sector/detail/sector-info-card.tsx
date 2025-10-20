import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconInfoCircle, IconShieldCheck } from "@tabler/icons-react-native";
import type { Sector } from '../../../../types';
import { SECTOR_PRIVILEGES_LABELS } from '../../../../constants';
import { formatDate } from '../../../../utils';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

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
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconInfoCircle size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Informações do Setor
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.infoGrid}>
          {/* Privilege Level */}
          <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
            <View style={styles.infoRow}>
              <IconShieldCheck size={16} color={colors.mutedForeground} />
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Nível de Privilégio
              </ThemedText>
            </View>
            <Badge variant="default" style={styles.badge}>
              <ThemedText style={{ fontSize: fontSize.xs, color: colors.primaryForeground }}>
                {SECTOR_PRIVILEGES_LABELS[sector.privileges]}
              </ThemedText>
            </Badge>
          </View>

          {/* Managed By */}
          {sector.managedByUsers && sector.managedByUsers.length > 0 && (
            <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
                Gerenciado por
              </ThemedText>
              <View style={styles.managersList}>
                {sector.managedByUsers.map((manager, index) => (
                  <ThemedText key={index} style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                    " {manager.name}
                  </ThemedText>
                ))}
              </View>
            </View>
          )}

          {/* Created At */}
          <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
              Data de Criação
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
              {formatDate(sector.createdAt)}
            </ThemedText>
          </View>

          {/* Updated At */}
          <View style={StyleSheet.flatten([styles.infoItem, { backgroundColor: colors.muted + "30" }])}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>
              Última Atualização
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
              {formatDate(sector.updatedAt)}
            </ThemedText>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  managersList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
