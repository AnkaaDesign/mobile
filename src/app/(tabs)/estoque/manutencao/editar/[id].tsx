import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function EditMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: maintenanceResponse, isLoading, error } = useMaintenance(id, {
    include: {
      item: true,
      maintenanceSchedule: true,
    },
  });
  const maintenance = maintenanceResponse?.data;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando manutenção...
        </Text>
      </View>
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
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
