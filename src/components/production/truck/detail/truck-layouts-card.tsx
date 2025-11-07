import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { LAYOUT_SIDE, LAYOUT_SIDE_LABELS } from "../../../../constants";
import {
  IconLayoutGrid,
  IconRuler,
  IconDoor,
} from "@tabler/icons-react-native";

interface Layout {
  id: string;
  height: number;
  side: string;
  layoutSections?: Array<{
    id: string;
    width: number;
    isDoor: boolean;
    doorOffset: number | null;
  }>;
}

interface TruckLayoutsCardProps {
  layouts: {
    leftSideLayout?: Layout | null;
    rightSideLayout?: Layout | null;
    backSideLayout?: Layout | null;
  };
}

export const TruckLayoutsCard: React.FC<TruckLayoutsCardProps> = ({ layouts }) => {
  const { colors } = useTheme();

  const hasLayouts = layouts.leftSideLayout || layouts.rightSideLayout || layouts.backSideLayout;

  if (!hasLayouts) {
    return null;
  }

  const renderLayout = (layout: Layout | null | undefined, sideName: string) => {
    if (!layout) {
      return null;
    }

    const sections = layout.layoutSections || [];
    const totalWidth = sections.reduce((sum, section) => sum + (section.width || 0), 0);
    const heightCm = Math.round(layout.height * 100);
    const widthCm = Math.round(totalWidth * 100);
    const doorsCount = sections.filter(s => s.isDoor).length;

    return (
      <View key={layout.id} style={[styles.layoutItem, { borderColor: colors.border }]}>
        <View style={styles.layoutHeader}>
          <ThemedText style={[styles.layoutSide, { color: colors.foreground }]}>
            {LAYOUT_SIDE_LABELS[layout.side as LAYOUT_SIDE] || sideName}
          </ThemedText>
          {doorsCount > 0 && (
            <Badge variant="secondary" style={styles.doorBadge}>
              <IconDoor size={12} color={colors.mutedForeground} />
              <ThemedText style={[styles.doorBadgeText, { color: colors.mutedForeground }]}>
                {doorsCount} porta{doorsCount > 1 ? "s" : ""}
              </ThemedText>
            </Badge>
          )}
        </View>

        <View style={styles.layoutDimensions}>
          <View style={styles.dimensionItem}>
            <IconRuler size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.dimensionLabel, { color: colors.mutedForeground }]}>
              Largura
            </ThemedText>
            <ThemedText style={[styles.dimensionValue, { color: colors.foreground }]}>
              {widthCm} cm
            </ThemedText>
          </View>
          <View style={styles.dimensionItem}>
            <IconRuler size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.dimensionLabel, { color: colors.mutedForeground }]}>
              Altura
            </ThemedText>
            <ThemedText style={[styles.dimensionValue, { color: colors.foreground }]}>
              {heightCm} cm
            </ThemedText>
          </View>
        </View>

        {sections.length > 0 && (
          <View style={styles.sectionsInfo}>
            <ThemedText style={[styles.sectionsLabel, { color: colors.mutedForeground }]}>
              {sections.length} seção{sections.length > 1 ? "ões" : ""}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconLayoutGrid size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Layouts do Caminhão</ThemedText>
      </View>

      <View style={styles.content}>
        {renderLayout(layouts.leftSideLayout, "Lado Motorista")}
        {renderLayout(layouts.rightSideLayout, "Lado Sapo")}
        {renderLayout(layouts.backSideLayout, "Traseira")}
      </View>

      {!hasLayouts && (
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Nenhum layout configurado
        </ThemedText>
      )}
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  layoutItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    gap: spacing.sm,
  },
  layoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  layoutSide: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  doorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  doorBadgeText: {
    fontSize: fontSize.xs,
  },
  layoutDimensions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  dimensionItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dimensionLabel: {
    fontSize: fontSize.xs,
  },
  dimensionValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  sectionsInfo: {
    marginTop: spacing.xs,
  },
  sectionsLabel: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: spacing.md,
  },
});
