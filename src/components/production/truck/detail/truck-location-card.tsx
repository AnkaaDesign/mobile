import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useRouter } from "expo-router";
import { spacing, fontSize } from "@/constants/design-system";
import { routes } from "../../../../constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import {
  IconMap,
  IconBuildingWarehouse,
  IconRoad,
  IconMapPin,
  IconChevronRight,
} from "@tabler/icons-react-native";

interface TruckLocationCardProps {
  truck: {
    xPosition?: number | null;
    yPosition?: number | null;
    garage?: {
      id: string;
      name: string;
    } | null;
  };
}

export const TruckLocationCard: React.FC<TruckLocationCardProps> = ({ truck }) => {
  const { colors } = useTheme();
  const router = useRouter();

  const handleGaragePress = () => {
    if (truck.garage?.id) {
      router.push(routeToMobilePath(routes.production.garages.details(truck.garage.id)) as any);
    }
  };

  const hasPosition = truck.xPosition !== null && truck.yPosition !== null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconMap size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Localização</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Garage */}
        {truck.garage ? (
          <TouchableOpacity
            style={[styles.garageButton, { backgroundColor: colors.muted + "50", borderColor: colors.border }]}
            onPress={handleGaragePress}
            activeOpacity={0.7}
          >
            <View style={styles.garageContent}>
              <View style={styles.garageInfo}>
                <View style={styles.garageHeader}>
                  <IconBuildingWarehouse size={18} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                    Garagem
                  </ThemedText>
                </View>
                <ThemedText style={[styles.garageName, { color: colors.foreground }]}>
                  {truck.garage.name}
                </ThemedText>
              </View>
              <IconChevronRight size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.infoItem}>
            <IconBuildingWarehouse size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Garagem
              </ThemedText>
              <ThemedText style={[styles.emptyValue, { color: colors.mutedForeground }]}>
                Não definida
              </ThemedText>
            </View>
          </View>
        )}

        {/* Position */}
        {hasPosition ? (
          <View style={styles.positionContainer}>
            <View style={styles.positionHeader}>
              <IconMapPin size={18} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Posição de Estacionamento
              </ThemedText>
            </View>
            <View style={styles.positionGrid}>
              <View style={styles.positionItem}>
                <ThemedText style={[styles.positionLabel, { color: colors.mutedForeground }]}>
                  Posição X
                </ThemedText>
                <ThemedText style={[styles.positionValue, { color: colors.foreground }]}>
                  {truck.xPosition}m
                </ThemedText>
              </View>
              <View style={styles.positionItem}>
                <ThemedText style={[styles.positionLabel, { color: colors.mutedForeground }]}>
                  Posição Y
                </ThemedText>
                <ThemedText style={[styles.positionValue, { color: colors.foreground }]}>
                  {truck.yPosition}m
                </ThemedText>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.infoItem}>
            <IconMapPin size={20} color={colors.mutedForeground} />
            <View style={styles.infoText}>
              <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
                Posição de Estacionamento
              </ThemedText>
              <ThemedText style={[styles.emptyValue, { color: colors.mutedForeground }]}>
                Não definida
              </ThemedText>
            </View>
          </View>
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
  emptyValue: {
    fontSize: fontSize.sm,
    fontStyle: "italic",
  },
  garageButton: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  garageContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  garageInfo: {
    flex: 1,
    gap: 4,
  },
  garageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  garageName: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  positionContainer: {
    gap: spacing.sm,
  },
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  positionGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  positionItem: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  positionLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  positionValue: {
    fontSize: fontSize.md,
    fontWeight: "600",
    fontFamily: "monospace",
  },
});
