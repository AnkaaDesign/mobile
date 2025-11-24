import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { PPEForm } from "@/components/inventory/ppe/form/ppe-form";
import { useItem } from "@/hooks/useItem";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function EditPPEScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: item, isLoading, error } = useItem(id, {
    include: {
      brand: true,
      category: true,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando EPI...
        </Text>
      </View>
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

  return <PPEForm mode="update" item={item} />;
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
