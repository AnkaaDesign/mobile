
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconRuler, IconAlertTriangle } from "@tabler/icons-react-native";
import type { PpeSize } from '../../../../../types';
import {
  SHIRT_SIZE_LABELS,
  PANTS_SIZE_LABELS,
  BOOT_SIZE_LABELS,
  SLEEVES_SIZE_LABELS,
  MASK_SIZE_LABELS,
  GLOVES_SIZE_LABELS,
  RAIN_BOOTS_SIZE_LABELS,
} from "@/constants";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface SizeCardProps {
  ppeSize: PpeSize;
}

export function SizeCard({ ppeSize }: SizeCardProps) {
  const { colors, isDark } = useTheme();

  const sizeFields = [
    { label: "Camisa", value: ppeSize.shirts, labels: SHIRT_SIZE_LABELS },
    { label: "Calça", value: ppeSize.pants, labels: PANTS_SIZE_LABELS },
    { label: "Bota", value: ppeSize.boots, labels: BOOT_SIZE_LABELS },
    { label: "Manga", value: ppeSize.sleeves, labels: SLEEVES_SIZE_LABELS },
    { label: "Máscara", value: ppeSize.mask, labels: MASK_SIZE_LABELS },
    { label: "Luva", value: ppeSize.gloves, labels: GLOVES_SIZE_LABELS },
    { label: "Bota de Chuva", value: ppeSize.rainBoots, labels: RAIN_BOOTS_SIZE_LABELS },
  ];

  const missingSizes = sizeFields.filter((field) => !field.value);
  const definedSizes = sizeFields.filter((field) => field.value);

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconRuler size={20} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>Tamanhos de EPI</ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.sizeContent}>
          {/* Defined Sizes */}
          {definedSizes.length > 0 && (
            <View style={styles.sizeSection}>
              <ThemedText style={StyleSheet.flatten([styles.sizeSectionTitle, { color: colors.foreground }])}>Tamanhos Definidos</ThemedText>
              <View style={styles.sizeGrid}>
                {definedSizes.map((field) => (
                  <View key={field.label} style={StyleSheet.flatten([styles.sizeItem, { backgroundColor: colors.muted + "30" }])}>
                    <ThemedText style={StyleSheet.flatten([styles.sizeLabel, { color: colors.mutedForeground }])}>{field.label}</ThemedText>
                    <Badge variant="default">
                      <ThemedText style={StyleSheet.flatten([styles.sizeValue, { color: colors.primaryForeground }])}>{field.labels[field.value as keyof typeof field.labels]}</ThemedText>
                    </Badge>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Missing Sizes Warning */}
          {missingSizes.length > 0 && (
            <View style={StyleSheet.flatten([styles.sizeSection, definedSizes.length > 0 && styles.sizeSectionBorder, { borderTopColor: colors.border + "50" }])}>
              <View style={styles.warningSectionHeader}>
                <View
                  style={[
                    styles.warningIconContainer,
                    {
                      backgroundColor: isDark ? extendedColors.yellow[900] + "20" : extendedColors.yellow[100],
                    },
                  ]}
                >
                  <IconAlertTriangle size={16} color={isDark ? extendedColors.yellow[400] : extendedColors.yellow[700]} />
                </View>
                <ThemedText style={[styles.sizeSectionTitle, { color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}>Tamanhos Não Definidos</ThemedText>
              </View>
              <View style={styles.sizeGrid}>
                {missingSizes.map((field) => (
                  <View
                    key={field.label}
                    style={[
                      styles.sizeItem,
                      styles.missingSizeItem,
                      {
                        backgroundColor: isDark ? extendedColors.yellow[900] + "10" : extendedColors.yellow[50],
                        borderColor: isDark ? extendedColors.yellow[500] : extendedColors.yellow[300],
                      },
                    ]}
                  >
                    <ThemedText style={[styles.sizeLabel, { color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}>{field.label}</ThemedText>
                    <ThemedText style={[styles.missingSizeValue, { color: isDark ? extendedColors.yellow[400] : extendedColors.yellow[700] }]}>Não definido</ThemedText>
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
                  Alguns tamanhos não foram definidos. Complete as informações para permitir entregas de EPI adequadas.
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  sizeContent: {
    gap: spacing.xl,
  },
  sizeSection: {
    gap: spacing.md,
  },
  sizeSectionBorder: {
    borderTopWidth: 1,
    paddingTop: spacing.xl,
  },
  sizeSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sizeGrid: {
    gap: spacing.md,
  },
  sizeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  sizeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  sizeValue: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  missingSizeItem: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  missingSizeValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontStyle: "italic",
  },
  warningSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  warningIconContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  warningNote: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  warningNoteText: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
