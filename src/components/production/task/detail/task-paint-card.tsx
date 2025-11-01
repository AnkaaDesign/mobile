import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { PAINT_FINISH_LABELS } from '@/constants/enum-labels';
import { PAINT_FINISH } from '@/constants/enums';
import { IconPaint, IconSparkles, IconBrush, IconAlertCircle } from "@tabler/icons-react-native";
import { PaintPreview } from "@/components/paint/paint-preview";

interface Paint {
  id: string;
  name: string;
  hex?: string;
  finish?: PAINT_FINISH;
  paintType?: {
    name: string;
    needGround?: boolean;
  };
  paintBrand?: {
    name: string;
  };
  manufacturer?: string;
}

interface TaskPaintCardProps {
  generalPainting?: Paint;
  logoPaints?: Paint[];
  onPaintPress?: (paintId: string) => void;
}

export const TaskPaintCard: React.FC<TaskPaintCardProps> = ({
  generalPainting,
  logoPaints = [],
  onPaintPress,
}) => {
  const { colors, isDark } = useTheme();

  if (!generalPainting && (!logoPaints || logoPaints.length === 0)) {
    return null;
  }

  const renderPaintItem = (paint: Paint, size: number = 80) => (
    <TouchableOpacity
      key={paint.id}
      style={[styles.paintItemContainer, { backgroundColor: isDark ? colors.muted + '20' : colors.muted + '50' }]}
      onPress={() => onPaintPress?.(paint.id)}
      activeOpacity={0.7}
    >
      <View style={styles.paintContent}>
        {/* Color Preview */}
        <View style={styles.previewContainer}>
          <PaintPreview
            baseColor={paint.hex || "#888888"}
            finish={paint.finish || PAINT_FINISH.SOLID}
            width={size}
            height={size}
            borderRadius={8}
          />
        </View>

        {/* Paint Information */}
        <View style={styles.paintInfo}>
          <View style={styles.paintHeader}>
            <ThemedText style={[styles.paintName, { color: colors.foreground }]} numberOfLines={1}>
              {paint.name}
            </ThemedText>
            {paint.hex && (
              <ThemedText style={[styles.hexCode, { color: colors.mutedForeground }]}>
                {paint.hex}
              </ThemedText>
            )}
          </View>

          {paint.paintType && (
            <ThemedText style={[styles.paintType, { color: colors.mutedForeground }]} numberOfLines={1}>
              {paint.paintType.name}
            </ThemedText>
          )}

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {paint.finish && (
              <Badge variant="secondary" style={styles.badge}>
                <View style={styles.badgeContent}>
                  <IconSparkles size={12} color={colors.secondaryForeground} />
                  <ThemedText style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                    {PAINT_FINISH_LABELS[paint.finish]}
                  </ThemedText>
                </View>
              </Badge>
            )}
            {paint.paintBrand?.name && (
              <Badge variant="outline" style={styles.badge}>
                <ThemedText style={[styles.badgeText, { color: colors.foreground }]}>
                  {paint.paintBrand.name}
                </ThemedText>
              </Badge>
            )}
          </View>
        </View>
      </View>

      {/* Primer Warning */}
      {paint.paintType?.needGround && (
        <View style={[styles.primerWarning, { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.1)' : '#fef3c7' }]}>
          <IconAlertCircle size={14} color={isDark ? '#fbbf24' : '#d97706'} />
          <ThemedText style={[styles.primerText, { color: isDark ? '#fbbf24' : '#92400e' }]}>
            Requer primer
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconPaint size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Tintas</ThemedText>
      </View>

      <View style={styles.content}>
        {/* General Painting */}
        {generalPainting && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconBrush size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Pintura Geral
              </ThemedText>
            </View>
            {renderPaintItem(generalPainting, 80)}
          </View>
        )}

        {/* Logo Paints */}
        {logoPaints && logoPaints.length > 0 && (
          <View style={[styles.section, generalPainting && styles.sectionWithMargin]}>
            <View style={styles.sectionHeader}>
              <IconPaint size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Tintas do Logo
              </ThemedText>
              <Badge variant="secondary" style={styles.countBadge}>
                {logoPaints.length}
              </Badge>
            </View>
            <View style={styles.logoPaintsContainer}>
              {logoPaints.map((paint) => renderPaintItem(paint, 60))}
            </View>
          </View>
        )}
      </View>
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
    fontWeight: "600",
    flex: 1,
  },
  content: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionWithMargin: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  paintItemContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  paintContent: {
    flexDirection: "row",
    gap: spacing.md,
  },
  previewContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paintInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  paintHeader: {
    gap: 4,
  },
  paintName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  hexCode: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  paintType: {
    fontSize: fontSize.sm,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: fontSize.xs,
  },
  primerWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  primerText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  logoPaintsContainer: {
    gap: spacing.sm,
  },
});
