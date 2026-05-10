import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EditMaintenanceScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <EditMaintenanceInner />
    </PrivilegeGate>
  );
}

function EditMaintenanceInner() {
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
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
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

  return <MaintenanceForm key={id} mode="update" maintenance={maintenance} />;
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
