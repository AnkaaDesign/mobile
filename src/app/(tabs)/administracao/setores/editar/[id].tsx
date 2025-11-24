import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { SectorForm } from "@/components/administration/sector/form/sector-form";
import { useSector } from "@/hooks/useSector";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function EditSectorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: sector, isLoading, error } = useSector(id);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando setor...
        </Text>
      </View>
    );
  }

  if (error || !sector) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar setor
        </Text>
      </View>
    );
  }

  return <SectorForm mode="update" sector={sector} />;
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
