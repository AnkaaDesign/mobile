import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { TRUCK_MANUFACTURER_LABELS } from "../../../../constants";
import type { Truck } from "../../../../types";
import {
  IconTruck,
  IconCar,
  IconSettings,
} from "@tabler/icons-react-native";

interface TruckInfoCardProps {
  truck: Truck & {
    plate?: string;
    model?: string;
    manufacturer?: string;
  };
}

export const TruckInfoCard: React.FC<TruckInfoCardProps> = ({ truck }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconTruck size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Informações Básicas</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Plate */}
        <View style={styles.infoItem}>
          <IconCar size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Placa
            </ThemedText>
            <ThemedText style={[styles.value, styles.monoValue, { color: colors.foreground }]}>
              {truck.plate?.toUpperCase() || "—"}
            </ThemedText>
          </View>
        </View>

        {/* Model */}
        <View style={styles.infoItem}>
          <IconSettings size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Modelo
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {truck.model || "—"}
            </ThemedText>
          </View>
        </View>

        {/* Manufacturer */}
        <View style={styles.infoItem}>
          <IconTruck size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Montadora
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {truck.manufacturer ? TRUCK_MANUFACTURER_LABELS[truck.manufacturer] : "—"}
            </ThemedText>
          </View>
        </View>
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
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  monoValue: {
    fontFamily: "monospace",
  },
});
