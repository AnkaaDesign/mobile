import React from "react";
import { View, TouchableOpacity , StyleSheet} from "react-native";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight, shadow } from "@/constants/design-system";
import { IconRefresh, IconEdit } from "@tabler/icons-react-native";

interface DetailsHeaderProps {
  title: string;
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  iconBackgroundColor?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onEdit?: () => void;
}

export function DetailsHeader({ title, icon: Icon, iconBackgroundColor, onRefresh, isRefreshing = false, onEdit }: DetailsHeaderProps) {
  const { colors } = useTheme();

  return (
    <Card style={{ ...styles.headerCard, backgroundColor: colors.card }}>
      <CardContent style={styles.headerContent}>
        <View style={styles.headerRow}>
          {Icon && (
            <View style={StyleSheet.flatten([styles.headerIcon, { backgroundColor: iconBackgroundColor || colors.primary + "10" }])}>
              <Icon size={20} color={colors.primary} />
            </View>
          )}
          <ThemedText style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])}>{title}</ThemedText>

          {/* Action Buttons */}
          <View style={styles.headerActions}>
            {onRefresh && (
              <TouchableOpacity onPress={onRefresh} style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.muted }])} activeOpacity={0.7} disabled={isRefreshing}>
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity onPress={onEdit} style={StyleSheet.flatten([styles.iconButton, { backgroundColor: colors.primary }])} activeOpacity={0.7}>
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
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
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  headerContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});

DetailsHeader.displayName = "DetailsHeader";
