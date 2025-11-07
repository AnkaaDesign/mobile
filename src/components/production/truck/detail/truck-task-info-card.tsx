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
  IconClipboardList,
  IconBuilding,
  IconChevronRight,
} from "@tabler/icons-react-native";

interface TruckTaskInfoCardProps {
  task?: {
    id: string;
    name?: string;
    plate?: string;
    serialNumber?: string;
    customer?: {
      fantasyName?: string;
      corporateName?: string;
    };
  };
}

export const TruckTaskInfoCard: React.FC<TruckTaskInfoCardProps> = ({ task }) => {
  const { colors } = useTheme();
  const router = useRouter();

  if (!task) {
    return null;
  }

  const handleTaskPress = () => {
    router.push(routeToMobilePath(routes.production.schedule.details(task.id)) as any);
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <IconClipboardList size={20} color={colors.mutedForeground} />
        <ThemedText style={styles.title}>Tarefa / Ordem de Serviço</ThemedText>
      </View>

      <TouchableOpacity
        style={[styles.taskButton, { backgroundColor: colors.muted + "50", borderColor: colors.border }]}
        onPress={handleTaskPress}
        activeOpacity={0.7}
      >
        <View style={styles.taskContent}>
          <View style={styles.taskInfo}>
            <ThemedText style={[styles.taskName, { color: colors.foreground }]}>
              {task.name || task.plate || "—"}
            </ThemedText>
            {task.customer && (
              <View style={styles.customerRow}>
                <IconBuilding size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.customerText, { color: colors.mutedForeground }]}>
                  {task.customer.fantasyName || task.customer.corporateName}
                </ThemedText>
              </View>
            )}
            {task.serialNumber && (
              <ThemedText style={[styles.serialNumber, { color: colors.mutedForeground }]}>
                NS: {task.serialNumber}
              </ThemedText>
            )}
          </View>
          <IconChevronRight size={20} color={colors.mutedForeground} />
        </View>
      </TouchableOpacity>
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
  taskButton: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  taskName: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  customerText: {
    fontSize: fontSize.sm,
  },
  serialNumber: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
});
