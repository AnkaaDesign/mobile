import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/lib/theme";
import { Icon } from "./icon";
import { Badge } from "./badge";
import { Button } from "./button";
import { Breadcrumb } from "./breadcrumb";
import { fontSize, fontWeight, spacing, borderRadius } from "@/constants/design-system";

export interface PageAction {
  key: string;
  label: string;
  icon?: string;
  onPress?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  loading?: boolean;
  hidden?: boolean;
}

interface BasePageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    onPress?: () => void;
  }>;
  backButton?: {
    label?: string;
    onPress?: () => void;
  };
  icon?: string;
  style?: ViewStyle;
  actions?: PageAction[];
}

interface DetailPageHeaderProps extends BasePageHeaderProps {
  variant: "detail";
  status?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  };
  metrics?: Array<{
    label: string;
    value: string | number;
    icon?: string;
  }>;
}

interface ListPageHeaderProps extends BasePageHeaderProps {
  variant: "list";
}

type PageHeaderProps = BasePageHeaderProps | DetailPageHeaderProps | ListPageHeaderProps;

export function PageHeader(props: PageHeaderProps) {
  const { colors } = useTheme();
  const {
    title,
    subtitle,
    breadcrumbs,
    backButton,
    icon,
    style,
    actions = [],
  } = props;

  const visibleActions = actions.filter((action) => !action.hidden);

  const renderTitle = () => {
    if (typeof title === "string") {
      return (
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {title}
        </Text>
      );
    }
    return title;
  };

  const renderSubtitle = () => {
    if (!subtitle) return null;

    if (typeof subtitle === "string") {
      return (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {subtitle}
        </Text>
      );
    }
    return subtitle;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Icon */}
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: colors.muted }]}>
              <Icon name={icon} size={24} color={colors.mutedForeground} />
            </View>
          )}

          <View style={styles.titleSection}>
            {/* Back Button & Title Row */}
            <View style={styles.titleRow}>
              {backButton && (
                <Pressable
                  onPress={backButton.onPress}
                  style={styles.backButton}
                  android_ripple={{ color: colors.accent }}
                >
                  <Icon name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
              )}

              {renderTitle()}

              {/* Status Badge for Detail Pages */}
              {props.variant === "detail" && props.status && (
                <Badge variant={props.status.variant || "default"} style={styles.statusBadge}>
                  <Text>{props.status.label}</Text>
                </Badge>
              )}
            </View>

            {/* Subtitle */}
            {renderSubtitle()}

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <View style={styles.breadcrumbContainer}>
                <Breadcrumb items={breadcrumbs} showHomeIcon={false} />
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {visibleActions.length > 0 && (
          <View style={styles.actionsContainer}>
            {visibleActions.slice(0, 2).map((action) => {
              const isIconOnly = !action.label || action.label.trim() === "";

              return (
                <Button
                  key={action.key}
                  variant={action.variant || "outline"}
                  size={isIconOnly ? "icon" : action.size || "sm"}
                  onPress={action.onPress}
                  disabled={action.disabled}
                  style={styles.actionButton}
                >
                  {action.icon && (
                    <Icon
                      name={action.loading ? "loader" : action.icon}
                      size={16}
                      color={colors.foreground}
                    />
                  )}
                  {!isIconOnly && action.label && (
                    <Text style={{ color: colors.foreground, marginLeft: action.icon ? 4 : 0 }}>
                      {action.label}
                    </Text>
                  )}
                </Button>
              );
            })}

            {visibleActions.length > 2 && (
              <Button variant="outline" size="icon">
                <Icon name="more-vertical" size={16} color={colors.foreground} />
              </Button>
            )}
          </View>
        )}
      </View>

      {/* Metrics for Detail Pages */}
      {props.variant === "detail" && props.metrics && props.metrics.length > 0 && (
        <View style={[styles.metricsContainer, { borderTopColor: colors.border }]}>
          {props.metrics.map((metric, index) => (
            <View key={index} style={styles.metricItem}>
              {metric.icon && (
                <Icon name={metric.icon} size={16} color={colors.mutedForeground} />
              )}
              <View>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {metric.label}
                </Text>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {metric.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    padding: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  statusBadge: {
    marginLeft: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  breadcrumbContainer: {
    marginTop: spacing.sm,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actionButton: {
    marginRight: spacing.xs,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: "45%",
  },
  metricLabel: {
    fontSize: fontSize.xs,
  },
  metricValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
