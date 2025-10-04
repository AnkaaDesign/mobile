import React from "react";
import { View, StyleSheet } from "react-native";
import type { Warning } from '../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { IconFileText } from "@tabler/icons-react-native";

interface DescriptionCardProps {
  warning: Warning;
}

export function DescriptionCard({ warning }: DescriptionCardProps) {
  const { colors } = useTheme();

  if (!warning.description) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle style={styles.sectionTitle}>
          <View style={styles.titleRow}>
            <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
              <IconFileText size={18} color={colors.primary} />
            </View>
            <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>Descrição Detalhada</ThemedText>
          </View>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <View style={StyleSheet.flatten([styles.descriptionBox, { backgroundColor: colors.muted + "30" }])}>
          <ThemedText style={StyleSheet.flatten([styles.descriptionText, { color: colors.foreground }])}>{warning.description}</ThemedText>
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
  descriptionBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.6,
  },
});
