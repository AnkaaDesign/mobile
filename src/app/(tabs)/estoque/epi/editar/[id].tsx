import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { PPEForm } from "@/components/inventory/ppe/form/ppe-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useItem } from "@/hooks/useItem";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { ThemedView } from "@/components/ui/themed-view";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EditPPEScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <EditPPEInner />
    </PrivilegeGate>
  );
}

function EditPPEInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: item, isLoading, error } = useItem(id, {
    include: { brand: true, category: true },
  });

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar EPI
        </Text>
      </View>
    );
  }

  return <PPEForm key={id} mode="update" item={item?.data} />;
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
