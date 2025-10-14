import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding, IconCertificate, IconUser } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from '../../../../utils';
import { getFileUrl } from '@/utils/file';

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
              Informações Básicas
            </ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.infoContainer}>
          {/* Logo Section */}
          {customer.logo && customer.logo.id && (
            <View style={styles.logoSection}>
              <View style={StyleSheet.flatten([styles.logoContainer, { borderColor: colors.muted, backgroundColor: colors.muted + "30" }])}>
                <Image
                  source={{ uri: getFileUrl(customer.logo) }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Identification Section */}
          <View style={styles.section}>
            <ThemedText style={StyleSheet.flatten([styles.sectionHeader, { color: colors.foreground }])}>
              Identificação
            </ThemedText>
            <View style={styles.fieldsContainer}>
              {/* Fantasy Name */}
              <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                  Nome Fantasia
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                  {customer.fantasyName}
                </ThemedText>
              </View>

              {/* Corporate Name */}
              {customer.corporateName && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Razão Social
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {customer.corporateName}
                  </ThemedText>
                </View>
              )}

              {/* CNPJ */}
              {customer.cnpj && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconCertificate size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      CNPJ
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {formatCNPJ(customer.cnpj)}
                  </ThemedText>
                </View>
              )}

              {/* CPF */}
              {customer.cpf && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconUser size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      CPF
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {formatCPF(customer.cpf)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Tags Section */}
          {customer.tags && customer.tags.length > 0 && (
            <View style={StyleSheet.flatten([styles.section, styles.tagsSection, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.sectionHeader, { color: colors.foreground }])}>
                Tags
              </ThemedText>
              <View style={styles.tagsContainer}>
                {customer.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={StyleSheet.flatten([styles.tag, { backgroundColor: colors.primary + "10" }])}
                  >
                    <ThemedText style={StyleSheet.flatten([styles.tagText, { color: colors.primary }])}>
                      {tag}
                    </ThemedText>
                  </View>
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
    gap: spacing.xl,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 128,
    height: 128,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tagsSection: {
    paddingTop: spacing.xl,
    borderTopWidth: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
