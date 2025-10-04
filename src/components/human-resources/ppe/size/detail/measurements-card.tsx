import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { IconRulerMeasure, IconShirt, IconHanger, IconShoe } from "@tabler/icons-react-native";
import type { PpeSize } from '../../../../../types';
import {
  SHIRT_SIZE_LABELS,
  PANTS_SIZE_LABELS,
  BOOT_SIZE_LABELS,
  SLEEVES_SIZE_LABELS,
  MASK_SIZE_LABELS,
  GLOVES_SIZE_LABELS,
  RAIN_BOOTS_SIZE_LABELS,
} from '../../../../../constants';
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface MeasurementsCardProps {
  ppeSize: PpeSize;
}

export function MeasurementsCard({ ppeSize }: MeasurementsCardProps) {
  const { colors } = useTheme();

  const measurementGroups = [
    {
      title: "Vestimenta Superior",
      icon: <IconShirt size={16} color={colors.mutedForeground} />,
      items: [
        { label: "Camisa", value: ppeSize.shirts, labels: SHIRT_SIZE_LABELS },
        { label: "Manga", value: ppeSize.sleeves, labels: SLEEVES_SIZE_LABELS },
      ],
    },
    {
      title: "Vestimenta Inferior",
      icon: <IconHanger size={16} color={colors.mutedForeground} />,
      items: [{ label: "Calça", value: ppeSize.pants, labels: PANTS_SIZE_LABELS }],
    },
    {
      title: "Calçados",
      icon: <IconShoe size={16} color={colors.mutedForeground} />,
      items: [
        { label: "Bota", value: ppeSize.boots, labels: BOOT_SIZE_LABELS },
        { label: "Bota de Chuva", value: ppeSize.rainBoots, labels: RAIN_BOOTS_SIZE_LABELS },
      ],
    },
    {
      title: "Proteção Individual",
      icon: <IconRulerMeasure size={16} color={colors.mutedForeground} />,
      items: [
        { label: "Máscara", value: ppeSize.mask, labels: MASK_SIZE_LABELS },
        { label: "Luva", value: ppeSize.gloves, labels: GLOVES_SIZE_LABELS },
      ],
    },
  ];

  // Filter out groups with no defined measurements
  const groupsWithMeasurements = measurementGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.value),
    }))
    .filter((group) => group.items.length > 0);

  if (groupsWithMeasurements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconRulerMeasure size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Medidas Detalhadas</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.measurementsContent}>
          {groupsWithMeasurements.map((group, groupIndex) => (
            <View key={group.title} style={[styles.measurementGroup, groupIndex > 0 && styles.measurementGroupBorder, { borderTopColor: colors.border + "50" }]}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupIconContainer, { backgroundColor: colors.muted + "30" }]}>{group.icon}</View>
                <ThemedText style={StyleSheet.flatten([styles.groupTitle, { color: colors.foreground }])}>{group.title}</ThemedText>
              </View>
              <View style={styles.groupItems}>
                {group.items.map((item) => (
                  <View key={item.label} style={[styles.measurementItem, { backgroundColor: colors.muted + "20" }]}>
                    <ThemedText style={StyleSheet.flatten([styles.measurementLabel, { color: colors.mutedForeground }])}>{item.label}</ThemedText>
                    <View style={[styles.measurementValueContainer, { backgroundColor: colors.primary + "10" }]}>
                      <ThemedText style={StyleSheet.flatten([styles.measurementValue, { color: colors.primary }])}>{item.labels[item.value as keyof typeof item.labels]}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
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
  measurementsContent: {
    gap: spacing.xl,
  },
  measurementGroup: {
    gap: spacing.md,
  },
  measurementGroupBorder: {
    borderTopWidth: 1,
    paddingTop: spacing.xl,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupIconContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  groupTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  groupItems: {
    gap: spacing.sm,
  },
  measurementItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  measurementLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  measurementValueContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  measurementValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
