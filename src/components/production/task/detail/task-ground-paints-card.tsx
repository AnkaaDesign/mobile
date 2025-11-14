import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconPalette, IconDroplet } from "@tabler/icons-react-native";
import { PAINT_FINISH_LABELS, PAINT_FINISH } from "@/constants";
import type { Paint } from "@/types";
import { PaintFinishPreview } from "@/components/painting/effects/paint-finish-preview";

interface TaskGroundPaintsCardProps {
  groundPaints: Paint[];
}

export function TaskGroundPaintsCard({ groundPaints }: TaskGroundPaintsCardProps) {
  const { colors } = useTheme();

  if (!groundPaints || groundPaints.length === 0) {
    return null;
  }

  const handlePaintPress = (paintId: string) => {
    router.push(`/(tabs)/catalogo/detalhes/${paintId}`);
  };

  const getFinishIcon = (finish: PAINT_FINISH) => {
    switch (finish) {
      case PAINT_FINISH.METALLIC:
        return "✦";
      case PAINT_FINISH.PEARL:
        return "◆";
      case PAINT_FINISH.MATTE:
        return "▪";
      case PAINT_FINISH.GLOSSY:
        return "●";
      case PAINT_FINISH.SATIN:
        return "◐";
      default:
        return "●";
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconDroplet size={20} color={colors.primary} />
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
            {/* Color Preview with Finish Effects */}
            <PaintFinishPreview
              baseColor={groundPaint.hex}
              finish={groundPaint.finish || PAINT_FINISH.SOLID}
              width={280}
              height={48}
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

              {/* Badges Row */}
              <View style={styles.badgesRow}>
                {/* Paint Type Badge */}
                {groundPaint.paintType && (
                  <Badge
                    variant="outline"
                    size="sm"
                    style={[styles.badge, { borderColor: colors.border }]}
                  >
                    <IconPalette size={10} color={colors.mutedForeground} />
                    <ThemedText
                      style={[styles.badgeText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {groundPaint.paintType.name}
                    </ThemedText>
                  </Badge>
                )}

                {/* Finish Badge */}
                {groundPaint.finish && (
                  <Badge
                    variant="outline"
                    size="sm"
                    style={[styles.badge, { borderColor: colors.border }]}
                  >
                    <ThemedText
                      style={[styles.finishIcon, { color: colors.mutedForeground }]}
                    >
                      {getFinishIcon(groundPaint.finish)}
                    </ThemedText>
                    <ThemedText
                      style={[styles.badgeText, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {PAINT_FINISH_LABELS[groundPaint.finish]}
                    </ThemedText>
                  </Badge>
                )}
              </View>

              {/* Brand */}
              {groundPaint.paintBrand && (
                <View style={styles.brandRow}>
                  <ThemedText
                    style={[styles.brandLabel, { color: colors.mutedForeground }]}
                  >
                    Marca:
                  </ThemedText>
                  <ThemedText
                    style={[styles.brandValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {groundPaint.paintBrand.name}
                  </ThemedText>
                </View>
              )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    maxWidth: 120,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  finishIcon: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  brandLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  brandValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
});
