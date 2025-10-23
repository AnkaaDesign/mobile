import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { router } from "expo-router";
import {
  IconLink,
  IconPalette,
  IconChevronRight,
} from "@tabler/icons-react-native";
import type { Paint } from "@/types";
import { PAINT_FINISH_LABELS } from "@/constants";

interface PaintRelatedCardProps {
  relatedPaints?: Pick<Paint, "id" | "name" | "code" | "hex" | "finish">[];
  relatedTo?: Pick<Paint, "id" | "name" | "code" | "hex" | "finish">[];
}

export const PaintRelatedCard: React.FC<PaintRelatedCardProps> = ({ relatedPaints, relatedTo }) => {
  const { colors } = useTheme();

  // Combine both arrays for display
  const allRelated = [
    ...(relatedPaints || []),
    ...(relatedTo || [])
  ];

  // Remove duplicates based on ID
  const uniqueRelated = allRelated.filter((paint, index, self) =>
    index === self.findIndex((p) => p.id === paint.id)
  );

  if (uniqueRelated.length === 0) {
    return null; // Don't show card if no related paints
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/(tabs)/painting/catalog/details/${paintId}`);
  };

  return (
    <Card style={styles.card}>
      {/* Header with icon and title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconLink size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Tintas Relacionadas
        </ThemedText>
        <Badge variant="secondary" style={{ marginLeft: "auto" }}>
          {uniqueRelated.length}
        </Badge>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {uniqueRelated.map((paint) => (
          <TouchableOpacity
            key={paint.id}
            style={[styles.paintItem, { borderColor: colors.border }]}
            onPress={() => handlePaintPress(paint.id)}
            activeOpacity={0.7}
          >
            {/* Color preview */}
            <View
              style={[
                styles.colorPreview,
                {
                  backgroundColor: paint.hex,
                  borderColor: colors.border
                }
              ]}
            />

            {/* Paint details */}
            <View style={styles.paintDetails}>
              <ThemedText
                style={[styles.paintName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {paint.name}
              </ThemedText>

              {paint.code && (
                <ThemedText
                  style={[styles.paintCode, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {paint.code}
                </ThemedText>
              )}

              <ThemedText style={[styles.hexValue, { color: colors.mutedForeground }]}>
                {paint.hex.toUpperCase()}
              </ThemedText>

              {paint.finish && (
                <Badge variant="outline" style={styles.finishBadge}>
                  {PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS] || paint.finish}
                </Badge>
              )}
            </View>

            <IconChevronRight size={16} color={colors.mutedForeground} style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alternative: Vertical list layout (uncomment if preferred) */}
      {/* <View style={styles.content}>
        {uniqueRelated.map((paint) => (
          <TouchableOpacity
            key={paint.id}
            style={[styles.paintItemVertical, { borderColor: colors.border }]}
            onPress={() => handlePaintPress(paint.id)}
            activeOpacity={0.7}
          >
            <View style={styles.paintRow}>
              <View
                style={[
                  styles.colorPreviewSmall,
                  {
                    backgroundColor: paint.hex,
                    borderColor: colors.border
                  }
                ]}
              />

              <View style={styles.paintInfo}>
                <ThemedText
                  style={[styles.paintNameVertical, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {paint.name}
                </ThemedText>
                <View style={styles.paintMeta}>
                  {paint.code && (
                    <ThemedText
                      style={[styles.paintCodeVertical, { color: colors.mutedForeground }]}
                    >
                      {paint.code}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.hexValueVertical, { color: colors.mutedForeground }]}>
                    {paint.hex.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              {paint.finish && (
                <Badge variant="outline" style={styles.finishBadgeVertical}>
                  {PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS]}
                </Badge>
              )}

              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        ))}
      </View> */}
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
  scrollContent: {
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  paintItem: {
    width: 140,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    position: "relative",
  },
  colorPreview: {
    width: "100%",
    height: 60,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  paintDetails: {
    gap: 2,
  },
  paintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  paintCode: {
    fontSize: fontSize.xs,
  },
  hexValue: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  finishBadge: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  chevron: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },

  // Vertical layout styles (alternative)
  content: {
    gap: spacing.sm,
  },
  paintItemVertical: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  paintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorPreviewSmall: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paintInfo: {
    flex: 1,
    gap: 2,
  },
  paintNameVertical: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  paintMeta: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  paintCodeVertical: {
    fontSize: fontSize.sm,
  },
  hexValueVertical: {
    fontSize: fontSize.sm,
    fontFamily: "monospace",
  },
  finishBadgeVertical: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
});