import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconLink } from "@tabler/icons-react-native";
import { PAINT_FINISH_LABELS } from "@/constants";
import type { Paint } from "@/types";
import { PaintPreview } from "@/components/painting/preview/painting-preview";

// Badge colors - unified neutral, more subtle
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },  // neutral-200/70, neutral-600
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },      // neutral-700/50, neutral-300
};

interface PaintRelatedPaintsCardProps {
  paint: Paint;
}

export function PaintRelatedPaintsCard({ paint }: PaintRelatedPaintsCardProps) {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;

  // Combine related paints and remove duplicates
  const allRelated = [
    ...(paint.relatedPaints || []),
    ...(paint.relatedTo || []),
  ].filter(
    (relatedPaint, index, self) =>
      index === self.findIndex((p) => p.id === relatedPaint.id)
  );

  const handlePaintPress = (paintId: string) => {
    router.push(`/pintura/catalogo/detalhes/${paintId}` as any);
  };

  if (allRelated.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconLink size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Tintas Relacionadas</ThemedText>
          <Badge variant="secondary" size="sm" style={{ marginLeft: spacing.xs }}>
            {allRelated.length}
          </Badge>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allRelated.map((relatedPaint) => (
          <TouchableOpacity
            key={relatedPaint.id}
            style={[
              styles.relatedPaintCard,
              {
                backgroundColor: colors.muted + "30",
                borderColor: colors.border,
              },
            ]}
            onPress={() => handlePaintPress(relatedPaint.id)}
            activeOpacity={0.7}
          >
            {/* Color Preview - uses stored image if available, falls back to hex */}
            <PaintPreview
              paint={relatedPaint}
              baseColor={relatedPaint.hex}
              width={256}
              height={64}
              borderRadius={0}
              style={styles.colorPreview}
            />

            {/* Paint Info */}
            <View style={styles.paintInfo}>
              {/* Paint Name */}
              <ThemedText
                style={[styles.paintName, { color: colors.foreground }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {relatedPaint.name}
              </ThemedText>

              {/* Hex Code */}
              {relatedPaint.hex && (
                <ThemedText
                  style={[styles.hexCode, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {relatedPaint.hex.toUpperCase()}
                </ThemedText>
              )}

              {/* Badges Row - unified gray/white style */}
              <View style={styles.badgesRow}>
                {/* Paint Brand Badge */}
                {relatedPaint.paintBrand?.name && (
                  <Badge
                    style={[styles.badge, { backgroundColor: badgeStyle.bg }]}
                  >
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {relatedPaint.paintBrand.name}
                    </ThemedText>
                  </Badge>
                )}

                {/* Finish Badge */}
                {relatedPaint.finish && (
                  <Badge
                    style={[styles.badge, { backgroundColor: badgeStyle.bg }]}
                  >
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {PAINT_FINISH_LABELS[relatedPaint.finish]}
                    </ThemedText>
                  </Badge>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  scrollContent: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  relatedPaintCard: {
    width: 256,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorPreview: {
    width: "100%",
    height: 64,
  },
  paintInfo: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  paintName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * 1.4,
  },
  hexCode: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
    fontWeight: fontWeight.medium,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    maxWidth: 120,
    borderWidth: 0,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
