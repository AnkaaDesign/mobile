
import { View, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding } from "@tabler/icons-react-native";
import type { Customer } from '../../../../types';
import { formatCNPJ, formatCPF } from "@/utils";
import { getFileUrl } from '@/utils/file';

interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const { colors } = useTheme();

  // Get initials for fallback display
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

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
          {/* Logo Section - Always show with fallback */}
          <View style={styles.logoSection}>
            <View style={StyleSheet.flatten([styles.logoContainer, { borderColor: colors.muted, backgroundColor: colors.muted + "30" }])}>
              {customer.logo && customer.logo.id ? (
                <Image
                  source={{ uri: getFileUrl(customer.logo!) }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={StyleSheet.flatten([styles.logoFallback, { backgroundColor: colors.primary + "20" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.logoInitials, { color: colors.primary }])}>
                    {getInitials(customer.fantasyName)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Identification Fields */}
          <View style={styles.fieldsContainer}>
            <DetailField label="Nome Fantasia" value={customer.fantasyName} icon="building" />

            {customer.corporateName && (
              <DetailField label="Razão Social" value={customer.corporateName} icon="building" />
            )}

            {customer.cnpj && (
              <DetailField label="CNPJ" value={formatCNPJ(customer.cnpj)} icon="certificate" />
            )}

            {customer.cpf && (
              <DetailField label="CPF" value={formatCPF(customer.cpf)} icon="user" />
            )}

            {customer.registrationStatus && (
              <DetailField label="Situação Cadastral" value={customer.registrationStatus} icon="certificate" />
            )}
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
    gap: spacing.md,
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
  logoFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitials: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  fieldsContainer: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.lg,
  },
  subsectionHeader: {
    fontSize: fontSize.base,
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
