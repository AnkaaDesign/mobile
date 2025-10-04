import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { Service } from '../../../../types';
import { IconTools } from "@tabler/icons-react-native";

interface TaskServicesCardProps {
  services: Service[];
}

export const TaskServicesCard: React.FC<TaskServicesCardProps> = ({ services }) => {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <IconTools size={20} color={colors.primary} />
        <ThemedText style={styles.title}>Serviços</ThemedText>
        <Badge variant="secondary" style={styles.countBadge}>
          {services.length}
        </Badge>
      </View>

      <View style={styles.content}>
        {services.map((service, index) => (
          <View
            key={service.id}
            style={[
              styles.serviceItem,
              index < services.length - 1 && styles.serviceItemBorder,
            ]}
          >
            <View style={styles.serviceInfo}>
              <ThemedText style={styles.serviceName}>{service.description}</ThemedText>
              {service.description && (
                <ThemedText style={styles.serviceDescription}>
                  {service.description}
                </ThemedText>
              )}
            </View>
            {true && (
              <Badge variant="outline" style={styles.statusBadge}>
                {true}
              </Badge>
            )}
          </View>
        ))}
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
    fontWeight: "600",
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  content: {
    gap: spacing.xs,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  serviceItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  serviceName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  serviceDescription: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});