import { View, StyleSheet, Image } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { DetailField } from "@/components/ui/detail-page-layout";

import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBuilding } from "@tabler/icons-react-native";
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

          {/* Identification Fields */}
          <View style={styles.fieldsContainer}>
            <DetailField label="Nome Fantasia" value={supplier.fantasyName} icon="building" />

            {supplier.corporateName && (
              <DetailField label="Razão Social" value={supplier.corporateName} icon="building" />
            )}

            {supplier.cnpj && (
              <DetailField label="CNPJ" value={formatCNPJ(supplier.cnpj)} icon="certificate" />
            )}
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
});
