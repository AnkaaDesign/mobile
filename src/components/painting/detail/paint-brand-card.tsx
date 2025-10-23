import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { router } from "expo-router";
import {
  IconBuildingFactory,
  IconChevronRight,
  IconPalette,
  IconPackage,
} from "@tabler/icons-react-native";
import type { PaintBrand } from "@/types";

interface PaintBrandCardProps {
  paintBrand?: PaintBrand & {
    _count?: {
      paints?: number;
      componentItems?: number;
    };
  };
}

export const PaintBrandCard: React.FC<PaintBrandCardProps> = ({ paintBrand }) => {
  const { colors } = useTheme();

  if (!paintBrand) {
    return null;
  }

  const handleBrandPress = () => {
    router.push(`/(tabs)/painting/paint-brands/details/${paintBrand.id}`);
  };

  return (
    <Card style={styles.card}>
      {/* Header with icon and title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconBuildingFactory size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Marca
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.content}
        onPress={handleBrandPress}
        activeOpacity={0.7}
      >
        <View style={styles.brandInfo}>
          {/* Brand name */}
          <View style={styles.brandHeader}>
            <ThemedText style={[styles.brandName, { color: colors.foreground }]}>
              {paintBrand.name}
            </ThemedText>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </View>

          {/* Statistics */}
          {paintBrand._count && (
            <View style={styles.stats}>
              {paintBrand._count.paints !== undefined && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
                    <IconPalette size={24} color={colors.primary} />
                  </View>
                  <View style={styles.statText}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                      {paintBrand._count.paints}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Tintas
                    </ThemedText>
                  </View>
                </View>
              )}

              {paintBrand._count.componentItems !== undefined && (
                <View style={styles.statItem}>
                  <View style={[styles.statIcon, { backgroundColor: colors.accent }]}>
                    <IconPackage size={24} color={colors.primary} />
                  </View>
                  <View style={styles.statText}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                      {paintBrand._count.componentItems}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Componentes
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Additional info if available */}
          <View style={styles.footer}>
            <Badge variant="outline">
              Ver detalhes da marca
            </Badge>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    // Touchable area
  },
  brandInfo: {
    gap: spacing.md,
  },
  brandHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statText: {
    gap: 2,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
  },
  footer: {
    marginTop: spacing.sm,
  },
});