import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconLayers } from "@tabler/icons-react-native";
import { PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS } from "@/constants";
import type { Paint } from "@/types";
import { PaintPreview } from "@/components/painting/preview/painting-preview";

// Badge colors - unified neutral, more subtle
const BADGE_COLORS = {
  light: { bg: 'rgba(229, 229, 229, 0.7)', text: '#525252' },  // neutral-200/70, neutral-600
  dark: { bg: 'rgba(64, 64, 64, 0.5)', text: '#d4d4d4' },      // neutral-700/50, neutral-300
};

interface TaskGroundPaintsCardProps {
  groundPaints: Paint[];
}

export function TaskGroundPaintsCard({ groundPaints }: TaskGroundPaintsCardProps) {
  const { colors, isDark } = useTheme();
  const badgeStyle = isDark ? BADGE_COLORS.dark : BADGE_COLORS.light;

  if (!groundPaints || groundPaints.length === 0) {
    return null;
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/(tabs)/catalogo/detalhes/${paintId}`);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconLayers size={20} color={colors.primary} />
          <ThemedText style={styles.title}>Fundos Recomendados</ThemedText>
          <Badge variant="secondary" size="sm" style={{ marginLeft: spacing.xs }}>
            {groundPaints.length}
          </Badge>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groundPaints.map((groundPaint) => (
          <TouchableOpacity
            key={groundPaint.id}
            style={[
              styles.groundPaintCard,
              {
                backgroundColor: colors.muted + "30",
                borderColor: colors.border,
              },
            ]}
            onPress={() => handlePaintPress(groundPaint.id)}
            activeOpacity={0.7}
          >
            {/* Color Preview - uses stored image if available, falls back to hex */}
            <PaintPreview
              paint={groundPaint}
              baseColor={groundPaint.hex}
              width={280}
              height={48}
              borderRadius={borderRadius.md}
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
                {groundPaint.name}
              </ThemedText>

              {/* Hex Code */}
              {groundPaint.hex && (
                <ThemedText
                  style={[styles.hexCode, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {groundPaint.hex.toUpperCase()}
                </ThemedText>
              )}

              {/* Badges Row - unified gray/white style */}
              <View style={styles.badgesRow}>
                {/* Paint Type Badge */}
                {groundPaint.paintType && (
                  <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {groundPaint.paintType.name}
                    </ThemedText>
                  </Badge>
                )}

                {/* Brand Badge */}
                {groundPaint.paintBrand && (
                  <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {groundPaint.paintBrand.name}
                    </ThemedText>
                  </Badge>
                )}

                {/* Finish Badge */}
                {groundPaint.finish && (
                  <Badge style={[styles.badge, { backgroundColor: badgeStyle.bg }]}>
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {PAINT_FINISH_LABELS[groundPaint.finish]}
                    </ThemedText>
                  </Badge>
                )}

                {/* Manufacturer Badge */}
                {groundPaint.manufacturer && (
                  <Badge style={[styles.badge, styles.manufacturerBadge, { backgroundColor: badgeStyle.bg }]}>
                    <ThemedText
                      style={[styles.badgeText, { color: badgeStyle.text }]}
                      numberOfLines={1}
                    >
                      {TRUCK_MANUFACTURER_LABELS[groundPaint.manufacturer] || groundPaint.manufacturer}
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
  groundPaintCard: {
    width: 280,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  colorPreview: {
    width: "100%",
    height: 48,
    borderRadius: borderRadius.md,
  },
  paintInfo: {
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0,
  },
  manufacturerBadge: {
    maxWidth: 100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
