import { View, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding, IconCertificate } from "@tabler/icons-react-native";
import type { Supplier } from "@/types";
import { formatCNPJ } from "@/utils";
import { getFileUrl } from "@/utils/file";

interface BasicInfoCardProps {
  supplier: Supplier;
}

export function BasicInfoCard({ supplier }: BasicInfoCardProps) {
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
              {supplier.logo && supplier.logo.id ? (
                <Image
                  source={{ uri: getFileUrl(supplier.logo) }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={StyleSheet.flatten([styles.logoFallback, { backgroundColor: colors.primary + "20" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.logoInitials, { color: colors.primary }])}>
                    {getInitials(supplier.fantasyName)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

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
                <ThemedText
                  style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {supplier.fantasyName}
                </ThemedText>
              </View>

              {/* Corporate Name */}
              {supplier.corporateName && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                    Razão Social
                  </ThemedText>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {supplier.corporateName}
                  </ThemedText>
                </View>
              )}

              {/* CNPJ */}
              {supplier.cnpj && (
                <View style={StyleSheet.flatten([styles.fieldRow, { backgroundColor: colors.muted + "50" }])}>
                  <View style={styles.fieldLabelWithIcon}>
                    <IconCertificate size={16} color={colors.mutedForeground} />
                    <ThemedText style={StyleSheet.flatten([styles.fieldLabel, { color: colors.mutedForeground }])}>
                      CNPJ
                    </ThemedText>
                  </View>
                  <ThemedText
                    style={StyleSheet.flatten([styles.fieldValue, { color: colors.foreground }])}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatCNPJ(supplier.cnpj)}
                  </ThemedText>
                </View>
              )}
            </View>
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
    gap: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flexShrink: 0,
  },
  fieldLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
});
