import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import type { Warning } from '../../../../types';
import { formatCPF } from '../../../../utils';
import { routes } from '../../../../constants';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconUsers, IconChevronRight } from "@tabler/icons-react-native";
import { router } from "expo-router";
import { routeToMobilePath } from "@/lib/route-mapper";

interface WitnessCardProps {
  warning: Warning;
}

export function WitnessCard({ warning }: WitnessCardProps) {
  const { colors } = useTheme();

  const handleWitnessPress = (witnessId: string) => {
    router.push(routeToMobilePath(routes.administration.collaborators.details(witnessId)) as any);
  };

  if (!warning.witness || warning.witness.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconUsers size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Testemunhas</ThemedText>
            <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
              {warning.witness.length}
            </Badge>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.witnessContainer}>
          {warning.witness.map((witness, index) => (
            <View key={witness.id}>
              <TouchableOpacity onPress={() => handleWitnessPress(witness.id)} activeOpacity={0.7}>
                <View style={StyleSheet.flatten([styles.witnessItem, { backgroundColor: colors.muted + "30" }])}>
                  <View style={styles.witnessInfo}>
                    <ThemedText style={StyleSheet.flatten([styles.witnessName, { color: colors.foreground }])}>
                      {witness.name}
                    </ThemedText>

                    {witness.cpf && (
                      <ThemedText style={StyleSheet.flatten([styles.witnessDetail, { color: colors.mutedForeground }])}>
                        CPF: {formatCPF(witness.cpf)}
                      </ThemedText>
                    )}

                    {(witness as any).position && (
                      <ThemedText style={StyleSheet.flatten([styles.witnessDetail, { color: colors.mutedForeground }])}>
                        Cargo: {(witness as any).position.name}
                      </ThemedText>
                    )}

                    {(witness as any).sector && (
                      <ThemedText style={StyleSheet.flatten([styles.witnessDetail, { color: colors.mutedForeground }])}>
                        Setor: {(witness as any).sector.name}
                      </ThemedText>
                    )}
                  </View>

                  <View style={StyleSheet.flatten([styles.chevronContainer, { backgroundColor: colors.primary + "10" }])}>
                    <IconChevronRight size={20} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>

              {index < warning.witness.length - 1 && (
                <View style={StyleSheet.flatten([styles.divider, { backgroundColor: colors.border }])} />
              )}
            </View>
          ))}
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
  witnessContainer: {
    gap: spacing.sm,
  },
  witnessItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  witnessInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  witnessName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  witnessDetail: {
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
});
