import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export default function EditCollaboratorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user, isLoading, error } = useUser(id, {
    include: {
      sector: true,
      position: true,
      managedSector: true,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando colaborador...
        </Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar colaborador
        </Text>
      </View>
    );
  }

  return <CollaboratorForm mode="update" user={user} />;
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
