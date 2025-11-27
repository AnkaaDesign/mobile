import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from '@/constants/enum-labels';
import { PAINT_FINISH } from '@/constants/enums';
import { IconPaint, IconAlertCircle } from "@tabler/icons-react-native";
import { PaintPreview } from "@/components/painting/preview/painting-preview";

const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },
};

interface Paint {
  id: string;
  name: string;
  hex?: string;
  colorPreview?: string | null;
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

interface TaskLogoPaintsCardProps {
  paints: Paint[];
  onPaintPress?: (paintId: string) => void;
}

export const TaskLogoPaintsCard: React.FC<TaskLogoPaintsCardProps> = ({
  paints,
  onPaintPress,
}) => {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;

  if (!paints || paints.length === 0) {
    return null;
  }

  const renderPaintItem = (paint: Paint) => {
    const manufacturerLabel = paint.manufacturer ? TRUCK_MANUFACTURER_LABELS[paint.manufacturer] || paint.manufacturer : null;

    return (
      <TouchableOpacity
        key={paint.id}
        style={[styles.paintItemContainer, { backgroundColor: isDark ? colors.muted + '20' : colors.muted + '50' }]}
        onPress={() => onPaintPress?.(paint.id)}
        activeOpacity={0.7}
      >
        <View style={styles.paintContent}>
          <View style={styles.previewContainer}>
            <PaintPreview
              baseColor={paint.hex || "#888888"}
              imageUrl={paint.colorPreview}
              width={44}
              height={44}
              borderRadius={8}
            />
          </View>

          <View style={styles.paintInfo}>
            <ThemedText style={[styles.paintName, { color: colors.foreground }]} numberOfLines={1}>
              {paint.name}
            </ThemedText>

            <View style={styles.badgesContainer}>
              {paint.paintType?.name && (
                <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]}>
                    {paint.paintType.name}
                  </ThemedText>
                </Badge>
              )}
              {paint.paintBrand?.name && (
                <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]}>
                    {paint.paintBrand.name}
                  </ThemedText>
                </Badge>
              )}
              {paint.finish && (
                <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]}>
                    {PAINT_FINISH_LABELS[paint.finish]}
                  </ThemedText>
                </Badge>
              )}
              {manufacturerLabel && (
                <Badge style={[styles.badge, styles.manufacturerBadge, { backgroundColor: badgeStyle.bg }]}>
                  <ThemedText style={[styles.badgeText, { color: badgeStyle.text }]} numberOfLines={1}>
                    {manufacturerLabel}
                  </ThemedText>
                </Badge>
              )}
            </View>
          </View>
        </View>

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
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconPaint size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Tintas da Logomarca</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {paints.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {paints.map((paint) => renderPaintItem(paint))}
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  content: {
    gap: spacing.sm,
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
    justifyContent: "center",
  },
  paintName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0,
  },
  manufacturerBadge: {
    maxWidth: 100,
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
});
