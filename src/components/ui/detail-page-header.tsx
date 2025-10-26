import React from "react";
import { View, TouchableOpacity, ViewStyle, StyleSheet } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight, shadow } from "@/constants/design-system";
import { IconRefresh, IconEdit } from "@tabler/icons-react-native";

// Base entity interface that all entities must implement
export interface BaseEntity {
  id: string;
  name: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Icon component type for React Native
export type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
}>;

// Badge configuration for additional entity information
export interface BadgeConfig {
  text: string;
  variant?: BadgeProps["variant"];
  show?: boolean;
}

// Props for the detail page header component
export interface DetailPageHeaderProps<T extends BaseEntity> {
  // Required props
  entity: T;
  icon: IconComponent;
  onRefresh: () => void;
  onEdit: () => void;

  // Optional customization
  subtitle?: string | React.ReactNode;
  badges?: BadgeConfig[];

  // Loading states
  isRefreshing?: boolean;

  // Style overrides
  style?: ViewStyle;
  iconBackgroundColor?: string;

  // Accessibility
  accessibilityLabel?: string;
  editAccessibilityLabel?: string;
  refreshAccessibilityLabel?: string;
}

/**
 * Abstract detail page header component for mobile applications.
 *
 * This component provides a consistent header pattern across all entity detail pages,
 * including an icon, entity name, optional subtitle, badges, and action buttons.
 *
 * @template T - The entity type extending BaseEntity
 */
export function DetailPageHeader<T extends BaseEntity>({
  entity,
  icon: IconComponent,
  onRefresh,
  onEdit,
  subtitle,
  badges = [],
  isRefreshing = false,
  style,
  iconBackgroundColor,
  accessibilityLabel,
  editAccessibilityLabel = `Editar ${entity.name}`,
  refreshAccessibilityLabel = `Atualizar dados de ${entity.name}`,
}: DetailPageHeaderProps<T>) {
  const { colors } = useTheme();

  // Filter and render badges
  const visibleBadges = badges.filter((badge) => badge.show !== false);

  // Get icon background color
  const getIconBackgroundColor = () => {
    if (iconBackgroundColor) return iconBackgroundColor;
    return colors.muted + "20";
  };

  return (
    <Card style={StyleSheet.flatten([styles.headerCard, { backgroundColor: colors.card }, style])} accessible accessibilityLabel={accessibilityLabel || `Detalhes de ${entity.name}`}>
      <CardContent style={styles.headerContent}>
        <View style={styles.headerRow}>
          {/* Entity Icon */}
          <View style={StyleSheet.flatten([styles.headerIcon, { backgroundColor: getIconBackgroundColor() }])}>
            <IconComponent size={24} color={colors.mutedForeground} />
          </View>

          {/* Entity Information */}
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <ThemedText style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])} numberOfLines={2} ellipsizeMode="tail">
                {entity.name}
              </ThemedText>

              {/* Action Buttons */}
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={onRefresh}
                  style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.muted }])}
                  activeOpacity={0.7}
                  disabled={isRefreshing}
                  accessible
                  accessibilityLabel={refreshAccessibilityLabel}
                  accessibilityRole="button"
                >
                  <IconRefresh size={18} color={colors.foreground} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onEdit}
                  style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                  accessible
                  accessibilityLabel={editAccessibilityLabel}
                  accessibilityRole="button"
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional Subtitle */}
            {subtitle && (
              <View style={styles.subtitleContainer}>
                {typeof subtitle === "string" ? (
                  <ThemedText style={StyleSheet.flatten([styles.subtitle, { color: colors.mutedForeground }])} numberOfLines={1} ellipsizeMode="tail">
                    {subtitle}
                  </ThemedText>
                ) : (
                  subtitle
                )}
              </View>
            )}

            {/* Badges */}
            {visibleBadges.length > 0 && (
              <View style={styles.badgesContainer}>
                {visibleBadges.map((badge, index) => (
                  <Badge key={index} variant={badge.variant || "default"} size="sm">
                    <ThemedText style={styles.badgeText}>{badge.text}</ThemedText>
                  </Badge>
                ))}
              </View>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  headerContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
    marginRight: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitleContainer: {
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});

DetailPageHeader.displayName = "DetailPageHeader";
