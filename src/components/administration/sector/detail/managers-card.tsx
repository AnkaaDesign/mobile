import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { IconUserShield } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

interface ManagersCardProps {
  managers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export function ManagersCard({ managers }: ManagersCardProps) {
  const { colors } = useTheme();

  if (!managers || managers.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <IconUserShield size={20} color={colors.primary} />
        <ThemedText style={styles.sectionTitle}>Gerenciadores do Setor</ThemedText>
        <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
          {managers.length}
        </Badge>
      </View>
      <View style={styles.managersList}>
        {managers.map((manager) => (
          <View key={manager.id} style={StyleSheet.flatten([styles.managerItem, { borderBottomColor: colors.border }])}>
            <View style={styles.managerInfo}>
              <ThemedText style={StyleSheet.flatten([styles.managerName, { color: colors.foreground }])}>
                {manager.name}
              </ThemedText>
              {manager.email && (
                <ThemedText style={StyleSheet.flatten([styles.managerEmail, { color: colors.mutedForeground }])}>
                  {manager.email}
                </ThemedText>
              )}
            </View>
          </View>
        ))}
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
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  managersList: {
    gap: 0,
  },
  managerItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  managerInfo: {
    gap: spacing.xs,
  },
  managerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  managerEmail: {
    fontSize: fontSize.xs,
  },
});
