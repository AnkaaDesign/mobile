import React from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Card, CardContent, CardHeader } from "./card";
import { ThemedText } from "./themed-text";
import { Icon } from "./icon";
import { Separator } from "./separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

/**
 * Standard Detail Page Layout Component
 *
 * Based on borrow and task (cronograma) detail page patterns.
 * Ensures consistent spacing, layout, and design across all detail pages.
 *
 * Usage:
 * ```tsx
 * <DetailPageLayout
 *   refreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 * >
 *   <DetailCard title="Basic Information" icon="info">
 *     <DetailField label="Name" value={data.name} icon="tag" />
 *     <DetailField label="Status" value={<Badge>{data.status}</Badge>} icon="circle-check" />
 *   </DetailCard>
 *
 *   <DetailCard title="Dates" icon="calendar">
 *     <DetailField label="Created At" value={formatDate(data.createdAt)} icon="clock" />
 *   </DetailCard>
 * </DetailPageLayout>
 * ```
 */

interface DetailPageLayoutProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: any;
}

export function DetailPageLayout({
  children,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
}: DetailPageLayoutProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

interface DetailCardProps {
  title: string;
  icon?: string;
  iconColor?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  style?: any;
}

/**
 * Standard Detail Card
 *
 * Card with consistent header styling including icon, title, and optional badge.
 */
export function DetailCard({
  title,
  icon,
  iconColor,
  badge,
  children,
  style,
}: DetailCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.card, style]}>
      <CardHeader style={styles.cardHeader}>
        <View style={styles.cardHeaderContent}>
          {icon && (
            <View style={[styles.iconBox, { backgroundColor: (iconColor || colors.primary) + "20" }]}>
              <Icon name={icon} size={20} color={iconColor || colors.primary} />
            </View>
          )}
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        </View>
        {badge}
      </CardHeader>
      <Separator />
      <CardContent style={styles.cardContent}>{children}</CardContent>
    </Card>
  );
}

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
  iconColor?: string;
  monospace?: boolean;
  style?: any;
}

/**
 * Standard Detail Field Row
 *
 * Displays a label-value pair with optional icon, following the consistent field pattern.
 */
export function DetailField({
  label,
  value,
  icon,
  iconColor,
  monospace = false,
  style,
}: DetailFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.fieldRow, style]}>
      <View style={styles.fieldLabel}>
        {icon && (
          <Icon name={icon} size={20} color={iconColor || colors.mutedForeground} />
        )}
        <ThemedText style={styles.labelText}>{label}</ThemedText>
      </View>
      <View style={styles.fieldValue}>
        {typeof value === "string" || typeof value === "number" ? (
          <ThemedText
            style={[
              styles.valueText,
              monospace && styles.monospace,
            ]}
          >
            {value}
          </ThemedText>
        ) : (
          value
        )}
      </View>
    </View>
  );
}

interface DetailSectionProps {
  title?: string;
  children: React.ReactNode;
  style?: any;
}

/**
 * Detail Section
 *
 * Groups related fields with optional section title and separator.
 */
export function DetailSection({ title, children, style }: DetailSectionProps) {
  return (
    <View style={[styles.section, style]}>
      {title && <ThemedText style={styles.sectionTitle}>{title}</ThemedText>}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md, // 16px horizontal/top
    paddingBottom: spacing.xxl * 2, // 96px bottom for navigation
    gap: spacing.lg, // 24px between cards
  },
  card: {
    marginBottom: 0, // Gap handled by content container
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  cardHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: fontSize.lg, // 18px
    fontWeight: fontWeight.medium, // 500
  },
  cardContent: {
    gap: spacing.md, // 16px between fields
  },
  fieldRow: {
    gap: spacing.xs, // 4px between label and value
  },
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm, // 8px between icon and label
  },
  labelText: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.medium, // 500
    opacity: 0.7,
  },
  fieldValue: {
    marginLeft: spacing.lg + spacing.sm, // Align with label text (icon width + gap)
  },
  valueText: {
    fontSize: fontSize.sm, // 14px
    fontWeight: fontWeight.semibold, // 600
  },
  monospace: {
    fontFamily: "monospace",
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  sectionContent: {
    gap: spacing.md,
  },
});
