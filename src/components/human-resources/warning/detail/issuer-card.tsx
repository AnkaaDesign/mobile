import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Warning } from '../../../../types';
import { formatCPF } from '../../../../utils';
import { routes } from '../../../../constants';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUserCheck, IconChevronRight } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";

interface IssuerCardProps {
  warning: Warning;
}

export function IssuerCard({ warning }: IssuerCardProps) {
  const { colors } = useTheme();

  const handleSupervisorPress = () => {
    if (warning.supervisor?.id) {
      router.push(routeToMobilePath(routes.administration.collaborators.details(warning.supervisor.id)) as any);
    }
  };

  if (!warning.supervisor) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUserCheck size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Emitido Por</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TouchableOpacity onPress={handleSupervisorPress} activeOpacity={0.7}>
          <View style={StyleSheet.flatten([styles.supervisorContainer, { backgroundColor: colors.muted + "30" }])}>
            <View style={styles.supervisorInfo}>
              <ThemedText style={StyleSheet.flatten([styles.supervisorName, { color: colors.foreground }])}>{warning.supervisor.name}</ThemedText>

              {warning.supervisor.cpf && <ThemedText style={StyleSheet.flatten([styles.supervisorDetail, { color: colors.mutedForeground }])}>CPF: {formatCPF(warning.supervisor.cpf)}</ThemedText>}

              {warning.supervisor.position && (
                <ThemedText style={StyleSheet.flatten([styles.supervisorDetail, { color: colors.mutedForeground }])}>Cargo: {warning.supervisor.position.name}</ThemedText>
              )}

              {warning.supervisor.sector && (
                <ThemedText style={StyleSheet.flatten([styles.supervisorDetail, { color: colors.mutedForeground }])}>Setor: {warning.supervisor.sector.name}</ThemedText>
              )}
            </View>

            <View style={StyleSheet.flatten([styles.chevronContainer, { backgroundColor: colors.primary + "10" }])}>
              <IconChevronRight size={20} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
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
  supervisorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  supervisorInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  supervisorName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  supervisorDetail: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
