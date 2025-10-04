import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { formatDateTime } from '../../../../utils';
import type { Service } from '../../../../types';
import { IconFileDescription, IconClock } from "@tabler/icons-react-native";

interface ServiceInfoCardProps {
  service: Service;
}

export const ServiceInfoCard: React.FC<ServiceInfoCardProps> = ({ service }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Informações do Serviço</ThemedText>
      </View>

      <View style={styles.content}>
        {/* Description */}
        <View style={styles.descriptionContainer}>
          <View style={styles.labelContainer}>
            <IconFileDescription size={16} color={colors.foreground} />
            <ThemedText style={styles.descriptionLabel}>Descrição:</ThemedText>
          </View>
          <ThemedText style={styles.descriptionText}>{service.description}</ThemedText>
        </View>

        {/* Created at */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconClock size={16} color={colors.foreground} />
            <ThemedText style={styles.label}>Criado em:</ThemedText>
          </View>
          <ThemedText style={styles.value}>{formatDateTime(service.createdAt)}</ThemedText>
        </View>

        {/* Updated at */}
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <IconClock size={16} color={colors.foreground} />
            <ThemedText style={styles.label}>Atualizado em:</ThemedText>
          </View>
          <ThemedText style={styles.value}>{formatDateTime(service.updatedAt)}</ThemedText>
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  content: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  icon: {
    opacity: 0.6,
  },
  label: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  descriptionContainer: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  descriptionLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});