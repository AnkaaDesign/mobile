import { View, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { FormSkeleton } from "@/components/ui/form-skeleton";

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

  useScreenReady(!isLoading);

  if (isLoading) {
    return (
      <FormSkeleton
        cards={[
          { title: true, titleWidth: "45%", fields: 5 },
          { title: true, titleWidth: "35%", fields: 4 },
          { title: true, titleWidth: "40%", fields: 3, toggleCount: 1 },
        ]}
        showActionBar
      />
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
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
