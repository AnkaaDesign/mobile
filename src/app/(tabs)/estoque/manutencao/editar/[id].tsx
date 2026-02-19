import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { Skeleton } from "@/components/ui/skeleton";
import { spacing } from "@/constants/design-system";

export default function EditMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: maintenanceResponse, isLoading, error } = useMaintenance(id, {
    include: {
      item: true,
      maintenanceSchedule: true,
    },
  });

  useScreenReady(!isLoading);
  const maintenance = maintenanceResponse?.data;

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={{ marginBottom: spacing.md }}>
                <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                <Skeleton width="100%" height={44} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  if (error || !maintenance) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar manutenção
        </Text>
      </View>
    );
  }

  return <MaintenanceForm mode="update" maintenance={maintenance} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
