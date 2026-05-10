import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, ViewStyle, StyleSheet, Modal, Pressable } from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight, shadow } from "@/constants/design-system";
import { IconRefresh, IconEdit, IconDotsVertical } from "@tabler/icons-react-native";
import type { PageAction } from "@/components/ui/page-header";

// Base entity interface that all entities must implement.
// `name` is optional — when absent, consumers must provide `displayName`
// on `<DetailPageHeader displayName=...>` (or via `<DetailScreen title=...>`).
export interface BaseEntity {
  id: string;
  name?: string;
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
  /**
   * Resolved title to display. When omitted, falls back to `entity.name`.
   * Required for transactional entities that lack a `name` field
   * (Borrow, PpeDelivery, Maintenance, etc.).
   */
  displayName?: string;
  subtitle?: string | React.ReactNode;
  badges?: BadgeConfig[];
  /**
   * Overflow-menu actions rendered to the right of the edit button.
   * Status / privilege guards must be applied by the caller (filter
   * before passing).
   */
  actions?: PageAction[];
  /** Hide the built-in edit button. Useful when edit is gated by status. */
  showEditButton?: boolean;

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
  displayName,
  subtitle,
  badges = [],
  actions = [],
  showEditButton = true,
  isRefreshing = false,
  style,
  iconBackgroundColor,
  accessibilityLabel,
  editAccessibilityLabel,
  refreshAccessibilityLabel,
}: DetailPageHeaderProps<T>) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const titleText = displayName ?? entity.name ?? "";
  const editLabel = editAccessibilityLabel ?? `Editar ${titleText}`;
  const refreshLabel = refreshAccessibilityLabel ?? `Atualizar dados de ${titleText}`;

  // Filter and render badges
  const visibleBadges = badges.filter((badge) => badge.show !== false);

  // Filter overflow actions (consumer should pre-filter on privilege/status,
  // but `hidden` flag still respected as last-line defense).
  const visibleActions = useMemo(
    () => actions.filter((a) => !a.hidden),
    [actions],
  );

  // Get icon background color
  const getIconBackgroundColor = () => {
    if (iconBackgroundColor) return iconBackgroundColor;
    return colors.muted + "20";
  };

  return (
    <Card style={StyleSheet.flatten([styles.headerCard, { backgroundColor: colors.card }, style])} accessible accessibilityLabel={accessibilityLabel || `Detalhes de ${titleText}`}>
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
                {titleText}
              </ThemedText>

              {/* Action Buttons */}
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={onRefresh}
                  style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.muted }])}
                  activeOpacity={0.7}
                  disabled={isRefreshing}
                  accessible
                  accessibilityLabel={refreshLabel}
                  accessibilityRole="button"
                >
                  <IconRefresh size={18} color={colors.foreground} />
                </TouchableOpacity>

                {showEditButton && (
                  <TouchableOpacity
                    onPress={onEdit}
                    style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.primary }])}
                    activeOpacity={0.7}
                    accessible
                    accessibilityLabel={editLabel}
                    accessibilityRole="button"
                  >
                    <IconEdit size={18} color={colors.primaryForeground} />
                  </TouchableOpacity>
                )}

                {visibleActions.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setMenuOpen(true)}
                    style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.muted }])}
                    activeOpacity={0.7}
                    accessible
                    accessibilityLabel="Mais ações"
                    accessibilityRole="button"
                  >
                    <IconDotsVertical size={18} color={colors.foreground} />
                  </TouchableOpacity>
                )}
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

      {/* Overflow action menu */}
      {visibleActions.length > 0 && (
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
            <View
              style={StyleSheet.flatten([
                styles.menuSheet,
                { backgroundColor: colors.card, borderColor: colors.border },
              ])}
            >
              {visibleActions.map((action) => {
                const isDestructive = action.variant === "destructive";
                return (
                  <TouchableOpacity
                    key={action.key}
                    onPress={() => {
                      setMenuOpen(false);
                      action.onPress?.();
                    }}
                    disabled={action.disabled || action.loading}
                    style={StyleSheet.flatten([styles.menuItem, { borderBottomColor: colors.border }])}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.menuItemText,
                        { color: isDestructive ? colors.destructive : colors.foreground },
                        (action.disabled || action.loading) && styles.menuItemDisabled,
                      ])}
                    >
                      {action.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xl,
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});

DetailPageHeader.displayName = "DetailPageHeader";
