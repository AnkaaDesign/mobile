import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from "../../../../utils";
import {
  IconClock,
  IconCalendar,
} from "@tabler/icons-react-native";

interface TruckMetadataCardProps {
  truck: {
    createdAt: Date | string;
    updatedAt: Date | string;
  };
}

export const TruckMetadataCard: React.FC<TruckMetadataCardProps> = ({ truck }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconClock size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Registro</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Created At */}
        <View style={styles.infoItem}>
          <IconCalendar size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Criado em
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(truck.createdAt)}
            </ThemedText>
          </View>
        </View>

        {/* Updated At */}
        <View style={styles.infoItem}>
          <IconClock size={20} color={colors.mutedForeground} />
          <View style={styles.infoText}>
            <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
              Atualizado em
            </ThemedText>
            <ThemedText style={[styles.value, { color: colors.foreground }]}>
              {formatDateTime(truck.updatedAt)}
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
    borderBottomWidth: 1,
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
});
