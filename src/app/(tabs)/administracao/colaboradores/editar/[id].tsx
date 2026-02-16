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
    // Use optimized select for better performance - fetches only fields needed for form
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      status: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      // Address fields for form
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      // Status tracking dates for form
      effectedAt: true,
      exp1StartAt: true,
      exp1EndAt: true,
      exp2StartAt: true,
      exp2EndAt: true,
      dismissedAt: true,
      // IDs for form selectors
      sectorId: true,
      positionId: true,
      // Timestamps
      createdAt: true,
      updatedAt: true,
      // Relations with minimal select for form dropdowns
      sector: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      managedSector: {
        select: {
          id: true,
          name: true,
        },
      },
      // PPE size for form
      ppeSize: true,
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

  return <CollaboratorForm mode="update" user={user?.data} />;
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
