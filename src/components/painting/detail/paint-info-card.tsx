import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  IconPalette,
  IconBarcode,
  IconDroplet,
  IconTag,
  IconBuildingFactory,
  IconColorSwatch,
} from "@tabler/icons-react-native";
import type { Paint, PaintType, PaintBrand } from "@/types";
import { PAINT_FINISH, PAINT_FINISH_LABELS, COLOR_PALETTE_LABELS } from "@/constants";

interface PaintInfoCardProps {
  paint: Paint & {
    paintType?: PaintType;
    paintBrand?: PaintBrand;
    _count?: {
      formulas?: number;
      productions?: number;
      relatedPaints?: number;
    };
  };
}

export const PaintInfoCard: React.FC<PaintInfoCardProps> = ({ paint }) => {
  const { colors } = useTheme();

  // Helper function to render info items
  const renderInfoItem = (
    icon: React.ReactNode,
    label: string,
    value: string | React.ReactNode | null | undefined
  ) => {
    if (!value) return null;

    return (
      <View style={styles.infoItem}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.infoTextContainer}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {value}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      {/* Header with icon and title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconPalette size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Informações da Tinta
        </ThemedText>
        {paint._count?.formulas && paint._count.formulas > 0 && (
          <Badge variant="secondary" style={{ marginLeft: "auto" }}>
            {paint._count.formulas} fórmula{paint._count.formulas !== 1 ? "s" : ""}
          </Badge>
        )}
      </View>

      <View style={styles.content}>
        {/* Paint code and name */}
        {renderInfoItem(
          <IconBarcode size={18} color={colors.mutedForeground} />,
          "Código",
          paint.code || "Sem código"
        )}

        {/* Color preview with hex */}
        <View style={styles.infoItem}>
          <View style={styles.iconContainer}>
            <IconColorSwatch size={18} color={colors.mutedForeground} />
          </View>
          <View style={styles.infoTextContainer}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Cor
            </ThemedText>
            <View style={styles.colorContainer}>
              <View
                style={[
                  styles.colorPreview,
                  {
                    backgroundColor: paint.hex,
                    borderColor: colors.border,
                  },
                ]}
              />
              <ThemedText style={[styles.value, { color: colors.foreground }]}>
                {paint.hex.toUpperCase()}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Paint finish */}
        {renderInfoItem(
          <IconDroplet size={18} color={colors.mutedForeground} />,
          "Acabamento",
          paint.finish ? (
            <Badge variant="outline">
              {PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS] || paint.finish}
            </Badge>
          ) : null
        )}

        {/* Paint type */}
        {paint.paintType && renderInfoItem(
          <IconTag size={18} color={colors.mutedForeground} />,
          "Tipo",
          <Badge variant={paint.paintType.needGround ? "destructive" : "default"}>
            {paint.paintType.name}
            {paint.paintType.needGround && " (Requer Fundo)"}
          </Badge>
        )}

        {/* Paint brand */}
        {paint.paintBrand && renderInfoItem(
          <IconBuildingFactory size={18} color={colors.mutedForeground} />,
          "Marca",
          paint.paintBrand.name
        )}

        {/* Manufacturer */}
        {paint.manufacturer && renderInfoItem(
          <IconBuildingFactory size={18} color={colors.mutedForeground} />,
          "Fabricante",
          paint.manufacturer
        )}

        {/* Palette */}
        {paint.palette && renderInfoItem(
          <IconColorSwatch size={18} color={colors.mutedForeground} />,
          "Paleta",
          COLOR_PALETTE_LABELS[paint.palette as keyof typeof COLOR_PALETTE_LABELS] || paint.palette
        )}

        {/* Tags */}
        {paint.tags && paint.tags.length > 0 && (
          <View style={styles.infoItem}>
            <View style={styles.iconContainer}>
              <IconTag size={18} color={colors.mutedForeground} />
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Tags
              </ThemedText>
              <View style={styles.tagContainer}>
                {paint.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" style={styles.tag}>
                    {tag}
                  </Badge>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Statistics */}
        {paint._count && (
          <>
            <Separator style={styles.separator} />
            <View style={styles.statsContainer}>
              {paint._count.formulas !== undefined && (
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.formulas}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Fórmulas
                  </ThemedText>
                </View>
              )}
              {paint._count.productions !== undefined && (
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.productions}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Produções
                  </ThemedText>
                </View>
              )}
              {paint._count.relatedPaints !== undefined && (
                <View style={styles.statItem}>
                  <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                    {paint._count.relatedPaints}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Relacionadas
                  </ThemedText>
                </View>
              )}
            </View>
          </>
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
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 24,
    alignItems: "center",
    paddingTop: 2,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  colorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  separator: {
    marginVertical: spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});