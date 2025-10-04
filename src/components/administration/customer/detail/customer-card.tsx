import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding, IconUser, IconTag } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from '../../../../utils';

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconBuilding size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
              Informações do Cliente
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.infoContainer}>
          {/* Fantasy Name */}
          <View style={styles.infoRow}>
            <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
              Nome Fantasia
            </ThemedText>
            <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
              {customer.fantasyName}
            </ThemedText>
          </View>

          {/* Corporate Name */}
          {customer.corporateName && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Razão Social
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
                {customer.corporateName}
              </ThemedText>
            </View>
          )}

          {/* CNPJ */}
          {customer.cnpj && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                CNPJ
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
                {formatCNPJ(customer.cnpj)}
              </ThemedText>
            </View>
          )}

          {/* CPF */}
          {customer.cpf && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                CPF
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.foreground }])}>
                {formatCPF(customer.cpf)}
              </ThemedText>
            </View>
          )}

          {/* Website */}
          {customer.site && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Website
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.value, { color: colors.primary }])}>
                {customer.site}
              </ThemedText>
            </View>
          )}

          {/* Tags */}
          {customer.tags && customer.tags.length > 0 && (
            <View style={styles.infoRow}>
              <ThemedText style={StyleSheet.flatten([styles.label, { color: colors.mutedForeground }])}>
                Tags
              </ThemedText>
              <View style={styles.tagsContainer}>
                {customer.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" style={styles.tag}>
                    <View style={styles.tagContent}>
                      <IconTag size={12} color={colors.mutedForeground} />
                      <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.foreground }])}>
                        {tag}
                      </ThemedText>
                    </View>
                  </Badge>
                ))}
              </View>
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
  infoContainer: {
    gap: spacing.lg,
  },
  infoRow: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  value: {
    fontSize: fontSize.base,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
  },
});
