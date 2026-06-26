import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, ViewStyle, StyleSheet, Modal, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
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
  /** Hide the built-in refresh button (e.g. read-only mirror screens that rely on pull-to-refresh). */
  showRefreshButton?: boolean;

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
  showRefreshButton = false,
  isRefreshing = false,
  style,
  iconBackgroundColor,
  accessibilityLabel,
  editAccessibilityLabel,
  refreshAccessibilityLabel,
}: DetailPageHeaderProps<T>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  const getIconBackgroundColor = () => {
    if (iconBackgroundColor) return iconBackgroundColor;
    return colors.muted;
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
                {showRefreshButton && (
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
                )}

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
            <Pressable
              style={StyleSheet.flatten([
                styles.menuSheet,
                { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
              ])}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={StyleSheet.flatten([styles.menuHandle, { backgroundColor: colors.border }])} />
              <ThemedText style={StyleSheet.flatten([styles.menuTitle, { color: colors.mutedForeground }])}>Ações</ThemedText>

              {visibleActions.map((action, idx) => {
                const isDestructive = action.variant === "destructive";
                const disabled = action.disabled || action.loading;
                const tint = isDestructive ? colors.destructive : colors.foreground;
                return (
                  <TouchableOpacity
                    key={action.key}
                    onPress={() => {
                      // Close the menu FIRST, then run the action after the modal has
                      // finished dismissing. Presenting a native sheet (PDF share/print)
                      // while this Modal is still animating out silently no-ops on iOS.
                      setMenuOpen(false);
                      const fn = action.onPress;
                      if (fn) setTimeout(fn, 300);
                    }}
                    disabled={disabled}
                    style={StyleSheet.flatten([
                      styles.menuItem,
                      { backgroundColor: isDestructive ? `${colors.destructive}12` : colors.muted },
                      disabled && styles.menuItemDisabled,
                      idx > 0 && { marginTop: spacing.sm },
                    ])}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemIcon}>
                      {action.loading ? (
                        <ActivityIndicator size="small" color={tint} />
                      ) : action.icon ? (
                        <Icon name={action.icon} size={20} color={tint} />
                      ) : null}
                    </View>
                    <ThemedText style={StyleSheet.flatten([styles.menuItemText, { color: tint }])}>
                      {action.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </Pressable>
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
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  menuHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  menuTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  menuItemIcon: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
});

DetailPageHeader.displayName = "DetailPageHeader";
