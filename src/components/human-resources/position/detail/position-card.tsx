import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconBriefcase, IconCheck, IconX } from "@tabler/icons-react-native";
import type { Position } from '../../../../types';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface PositionCardProps {
  position: Position;
}

export function PositionCard({ position }: PositionCardProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconBriefcase size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Informações do Cargo</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.positionContent}>
          {/* Position Name */}
          <View style={styles.infoSection}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Nome do Cargo</ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>{position.name}</ThemedText>
          </View>

          {/* Bonifiable Status */}
          <View style={StyleSheet.flatten([styles.infoSection, styles.infoSectionBorder, { borderTopColor: colors.border + "50" }])}>
            <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Elegível para Bonificação</ThemedText>
            <View style={styles.badgeContainer}>
              <Badge variant={position.bonifiable ? "success" : "secondary"}>
                <View style={styles.badgeContent}>
                  {position.bonifiable ? <IconCheck size={14} color={colors.primaryForeground} /> : <IconX size={14} color={colors.primaryForeground} />}
                  <ThemedText style={StyleSheet.flatten([styles.badgeText, { color: colors.primaryForeground }])}>{position.bonifiable ? "Sim" : "Não"}</ThemedText>
                </View>
              </Badge>
            </View>
          </View>

          {/* Employee Count */}
          {position._count && (
            <View style={StyleSheet.flatten([styles.infoSection, styles.infoSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Total de Colaboradores</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {position._count.users || 0} {position._count.users === 1 ? "colaborador" : "colaboradores"}
              </ThemedText>
            </View>
          )}

          {/* Remunerations Count */}
          {position._count && (
            <View style={StyleSheet.flatten([styles.infoSection, styles.infoSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.infoLabel, { color: colors.mutedForeground }])}>Histórico de Remunerações</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.infoValue, { color: colors.foreground }])}>
                {position._count.remunerations || 0} {position._count.remunerations === 1 ? "registro" : "registros"}
              </ThemedText>
            </View>
          )}
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
  positionContent: {
    gap: spacing.lg,
  },
  infoSection: {
    gap: spacing.sm,
  },
  infoSectionBorder: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  badgeContainer: {
    alignItems: "flex-start",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
