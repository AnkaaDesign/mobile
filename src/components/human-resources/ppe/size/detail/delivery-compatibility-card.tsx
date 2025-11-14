
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconPackage, IconCircleCheck, IconCircleX, IconInfoCircle } from "@tabler/icons-react-native";
import type { PpeSize } from '../../../../../types';
import {
  PPE_TYPE,
  PPE_TYPE_LABELS,
  SHIRT_SIZE,
  PANTS_SIZE,
  BOOT_SIZE,
  SLEEVES_SIZE,
  MASK_SIZE,
  GLOVES_SIZE,
  RAIN_BOOTS_SIZE,
} from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface DeliveryCompatibilityCardProps {
  ppeSize: PpeSize;
}

export function DeliveryCompatibilityCard({ ppeSize }: DeliveryCompatibilityCardProps) {
  const { colors, isDark } = useTheme();

  // Map PPE types to their corresponding size fields
  const ppeTypeMapping: Array<{
    type: PPE_TYPE;
    label: string;
    sizeValue: SHIRT_SIZE | PANTS_SIZE | BOOT_SIZE | SLEEVES_SIZE | MASK_SIZE | GLOVES_SIZE | RAIN_BOOTS_SIZE | null;
    isAvailable: boolean;
  }> = [
    {
      type: PPE_TYPE.SHIRT,
      label: PPE_TYPE_LABELS[PPE_TYPE.SHIRT],
      sizeValue: ppeSize.shirts,
      isAvailable: !!ppeSize.shirts,
    },
    {
      type: PPE_TYPE.PANTS,
      label: PPE_TYPE_LABELS[PPE_TYPE.PANTS],
      sizeValue: ppeSize.pants,
      isAvailable: !!ppeSize.pants,
    },
    {
      type: PPE_TYPE.BOOTS,
      label: PPE_TYPE_LABELS[PPE_TYPE.BOOTS],
      sizeValue: ppeSize.boots,
      isAvailable: !!ppeSize.boots,
    },
    {
      type: PPE_TYPE.SLEEVES,
      label: PPE_TYPE_LABELS[PPE_TYPE.SLEEVES],
      sizeValue: ppeSize.sleeves,
      isAvailable: !!ppeSize.sleeves,
    },
    {
      type: PPE_TYPE.MASK,
      label: PPE_TYPE_LABELS[PPE_TYPE.MASK],
      sizeValue: ppeSize.mask,
      isAvailable: !!ppeSize.mask,
    },
    {
      type: PPE_TYPE.GLOVES,
      label: PPE_TYPE_LABELS[PPE_TYPE.GLOVES],
      sizeValue: ppeSize.gloves,
      isAvailable: !!ppeSize.gloves,
    },
    {
      type: PPE_TYPE.RAIN_BOOTS,
      label: PPE_TYPE_LABELS[PPE_TYPE.RAIN_BOOTS],
      sizeValue: ppeSize.rainBoots,
      isAvailable: !!ppeSize.rainBoots,
    },
  ];

  const availableTypes = ppeTypeMapping.filter((item) => item.isAvailable);
  const unavailableTypes = ppeTypeMapping.filter((item) => !item.isAvailable);

  return (
    <Card style={styles.card}>
      <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.titleRow}>
          <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
            <IconPackage size={18} color={colors.primary} />
          </View>
          <ThemedText style={[styles.titleText, { color: colors.foreground }]}>Compatibilidade de Entregas</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.compatibilityContent}>
          {/* Info Note */}
          <View style={[styles.infoNote, { backgroundColor: colors.muted + "20", borderColor: colors.border }]}>
            <IconInfoCircle size={16} color={colors.mutedForeground} />
            <ThemedText style={[styles.infoNoteText, { color: colors.mutedForeground }]}>
              Apenas EPIs com tamanhos definidos podem ser entregues automaticamente.
            </ThemedText>
          </View>

          {/* Available for Delivery */}
          {availableTypes.length > 0 && (
            <View style={styles.compatibilitySection}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionIconContainer, { backgroundColor: extendedColors.green[100] }]}>
                  <IconCircleCheck size={16} color={extendedColors.green[600]} />
                </View>
                <ThemedText style={[(styles as any).sectionTitle, { color: colors.foreground }]}>Disponíveis para Entrega ({availableTypes.length})</ThemedText>
              </View>
              <View style={styles.itemsGrid}>
                {availableTypes.map((item) => (
                  <View key={item.type} style={[styles.compatibilityItem, { backgroundColor: extendedColors.green[50], borderColor: extendedColors.green[200] }]}>
                    <ThemedText style={[styles.itemLabel, { color: extendedColors.green[800] }]}>{item.label}</ThemedText>
                    <Badge variant="success">
                      <View style={styles.badgeContent}>
                        <IconCircleCheck size={12} color={colors.primaryForeground} />
                        <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>Disponível</ThemedText>
                      </View>
                    </Badge>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Not Available for Delivery */}
          {unavailableTypes.length > 0 && (
            <View style={[styles.compatibilitySection, availableTypes.length > 0 && styles.compatibilitySectionBorder, { borderTopColor: colors.border + "50" }]}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={[
                    styles.sectionIconContainer,
                    {
                      backgroundColor: isDark ? extendedColors.red[900] + "20" : extendedColors.red[100],
                    },
                  ]}
                >
                  <IconCircleX size={16} color={isDark ? extendedColors.red[400] : extendedColors.red[600]} />
                </View>
                <ThemedText style={[(styles as any).sectionTitle, { color: colors.foreground }]}>Indisponíveis para Entrega ({unavailableTypes.length})</ThemedText>
              </View>
              <View style={styles.itemsGrid}>
                {unavailableTypes.map((item) => (
                  <View
                    key={item.type}
                    style={[
                      styles.compatibilityItem,
                      {
                        backgroundColor: isDark ? extendedColors.red[900] + "10" : extendedColors.red[50],
                        borderColor: isDark ? extendedColors.red[500] : extendedColors.red[200],
                      },
                    ]}
                  >
                    <ThemedText style={[styles.itemLabel, { color: isDark ? extendedColors.red[300] : extendedColors.red[800] }]}>{item.label}</ThemedText>
                    <Badge variant="destructive">
                      <View style={styles.badgeContent}>
                        <IconCircleX size={12} color={colors.primaryForeground} />
                        <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>Indisponível</ThemedText>
                      </View>
                    </Badge>
                  </View>
                ))}
              </View>
              <View
                style={[
                  styles.warningNote,
                  {
                    backgroundColor: isDark ? extendedColors.yellow[900] + "10" : extendedColors.yellow[50],
                    borderColor: isDark ? extendedColors.yellow[500] : extendedColors.yellow[300],
                  },
                ]}
              >
                <ThemedText style={[styles.warningNoteText, { color: isDark ? extendedColors.yellow[300] : extendedColors.yellow[800] }]}>
                  Complete os tamanhos acima para habilitar entregas automáticas destes EPIs.
                </ThemedText>
              </View>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  compatibilityContent: {
    gap: spacing.xl,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  infoNoteText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: fontSize.sm * 1.5,
  },
  compatibilitySection: {
    gap: spacing.md,
  },
  compatibilitySectionBorder: {
    borderTopWidth: 1,
    paddingTop: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  itemsGrid: {
    gap: spacing.sm,
  },
  compatibilityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  itemLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  warningNote: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  warningNoteText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
