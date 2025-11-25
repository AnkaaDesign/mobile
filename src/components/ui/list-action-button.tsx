import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import type { BadgeProps } from "@/components/ui/badge";

interface ListActionButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  badgeCount?: number;
  badgeVariant?: BadgeProps["variant"];
  style?: ViewStyle;
  showBadge?: boolean;
}

/**
 * A standardized action button component for list pages with an optional badge indicator.
 * Used for filter and column visibility buttons across the app.
 *
 * @example
 * <ListActionButton
 *   icon={<IconFilter size={20} color={colors.foreground} />}
 *   onPress={() => setShowFilters(true)}
 *   badgeCount={activeFiltersCount}
 *   badgeVariant="destructive"
 *   showBadge={activeFiltersCount > 0}
 * />
 */
export function ListActionButton({
  icon,
  onPress,
  badgeCount,
  badgeVariant = "primary",
  style,
  showBadge = true,
}: ListActionButtonProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.actionButtonWrapper}>
      <Button
        variant="outline"
        onPress={onPress}
        style={StyleSheet.flatten([
          styles.actionButton,
          { backgroundColor: colors.input },
          style,
        ])}
      >
        {icon}
      </Button>
      {showBadge && badgeCount !== undefined && (
        <Badge
          style={StyleSheet.flatten([
            styles.actionBadge,
            badgeVariant === "primary" && { backgroundColor: colors.primary },
          ])}
          variant={badgeVariant}
          size="sm"
        >
          <ThemedText
            style={[
              styles.actionBadgeText,
              badgeVariant === "primary" && { color: colors.primaryForeground },
              badgeVariant === "destructive" && { color: "white" },
            ]}
          >
            {badgeCount}
          </ThemedText>
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtonWrapper: {
    position: "relative",
  },
  actionButton: {
    height: 48,
    width: 48,
    borderRadius: 10,
    paddingHorizontal: 0,
  },
  actionBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
});
