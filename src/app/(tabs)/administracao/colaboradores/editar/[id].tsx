import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EditCollaboratorScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] }}>
      <EditCollaboratorInner />
    </PrivilegeGate>
  );
}

function EditCollaboratorInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user, isLoading, error } = useUser(id, {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      cpf: true,
      pis: true,
      birth: true,
      currentContractType: true,
      currentContractStatus: true,
      isActive: true,
      verified: true,
      avatarId: true,
      payrollNumber: true,
      performanceLevel: true,
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      currentContract: true,
      employmentContracts: true,
      sectorId: true,
      positionId: true,
      createdAt: true,
      updatedAt: true,
      sector: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      ledSector: { select: { id: true, name: true } },
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

  return <CollaboratorForm key={id} mode="update" user={user?.data} />;
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
