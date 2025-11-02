
import { View, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding, IconCertificate, IconUser, IconFileDescription } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from '../../../../utils';
import { getFileUrl } from '@/utils/file';

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconBuilding size={20} color={colors.mutedForeground} />
          <ThemedText style={styles.title}>Informações Básicas</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
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
            <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
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
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
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

              {/* Situação Cadastral */}
              {customer.situacaoCadastral && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconCertificate size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      Situação Cadastral
                    </ThemedText>
                  </View>
                  <ThemedText style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}>
                    {customer.situacaoCadastral}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Tags Section */}
          {customer.tags && customer.tags.length > 0 && (
            <View style={StyleSheet.flatten([styles.section, styles.tagsSection, { borderTopColor: colors.border + "50" }])}>
              <ThemedText style={StyleSheet.flatten([styles.subsectionHeader, { color: colors.foreground }])}>
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
  content: {
    gap: spacing.sm,
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
  subsectionHeader: {
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    flex: 1,
    textAlign: "right",
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
