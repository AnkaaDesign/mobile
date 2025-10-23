import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { router } from "expo-router";
import {
  IconCategory,
  IconAlertTriangle,
  IconChevronRight,
  IconDroplet,
} from "@tabler/icons-react-native";
import type { PaintType } from "@/types";
import { PAINT_TYPE_ENUM_LABELS } from "@/constants";

interface PaintTypeCardProps {
  paintType?: PaintType & {
    _count?: {
      paints?: number;
      componentItems?: number;
    };
  };
}

export const PaintTypeCard: React.FC<PaintTypeCardProps> = ({ paintType }) => {
  const { colors } = useTheme();

  if (!paintType) {
    return null;
  }

  const handleTypePress = () => {
    router.push(`/(tabs)/painting/paint-types/details/${paintType.id}`);
  };

  return (
    <Card style={styles.card}>
      {/* Header with icon and title */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconCategory size={20} color={colors.primary} />
        <ThemedText style={[styles.title, { color: colors.foreground }]}>
          Tipo de Tinta
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.content}
        onPress={handleTypePress}
        activeOpacity={0.7}
      >
        <View style={styles.typeInfo}>
          {/* Type name */}
          <View style={styles.typeHeader}>
            <ThemedText style={[styles.typeName, { color: colors.foreground }]}>
              {paintType.name}
            </ThemedText>
            <IconChevronRight size={20} color={colors.mutedForeground} />
          </View>

          {/* Chemical type */}
          {paintType.type && (
            <View style={styles.chemicalType}>
              <Badge variant="secondary">
                {PAINT_TYPE_ENUM_LABELS[paintType.type as keyof typeof PAINT_TYPE_ENUM_LABELS] || paintType.type}
              </Badge>
            </View>
          )}

          {/* Ground requirement alert */}
          {paintType.needGround && (
            <Alert
              variant="warning"
              icon={<IconAlertTriangle size={18} />}
              style={styles.groundAlert}
            >
              <View>
                <ThemedText style={[styles.alertTitle, { color: colors.foreground }]}>
                  Requer Fundo
                </ThemedText>
                <ThemedText style={[styles.alertDescription, { color: colors.mutedForeground }]}>
                  Este tipo de tinta necessita aplicação de fundo/primer antes da pintura final
                </ThemedText>
              </View>
            </Alert>
          )}

          {/* Statistics */}
          {paintType._count && (
            <View style={styles.stats}>
              {paintType._count.paints !== undefined && (
                <View style={styles.statItem}>
                  <IconDroplet size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Tintas:
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {paintType._count.paints}
                  </ThemedText>
                </View>
              )}
              {paintType._count.componentItems !== undefined && (
                <View style={styles.statItem}>
                  <IconCategory size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    Componentes:
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                    {paintType._count.componentItems}
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
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
    // Touchable area
  },
  typeInfo: {
    gap: spacing.md,
  },
  typeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  chemicalType: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  groundAlert: {
    marginTop: spacing.sm,
  },
  alertTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: fontSize.sm,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});