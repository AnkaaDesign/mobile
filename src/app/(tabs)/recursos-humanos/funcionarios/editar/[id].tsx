import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useUser } from "@/hooks/useUser";
import { useTheme } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EmployeeEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] }}>
      <EmployeeEditInner key={id} />
    </PrivilegeGate>
  );
}

function EmployeeEditInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const nav = useNav();
  const { data: user, isLoading, error } = useUser(id, {
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
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      effectedAt: true,
      exp1StartAt: true,
      exp1EndAt: true,
      exp2StartAt: true,
      exp2EndAt: true,
      dismissedAt: true,
      sectorId: true,
      positionId: true,
      createdAt: true,
      updatedAt: true,
      sector: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      ledSector: { select: { id: true, name: true } },
      ppeSize: true,
    },
    enabled: !!id && id !== "",
  });

  useScreenReady(!isLoading);

  const handleSuccess = (userId?: string) => {
    if (userId) {
      nav.replace(mobileRoute(`/recursos-humanos/funcionarios/detalhes/${userId}`));
    } else {
      nav.goBack();
    }
  };

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

  if (error || !user?.data) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar funcionário
        </Text>
      </View>
    );
  }

  return <CollaboratorForm key={id} mode="update" user={user.data} onSuccess={handleSuccess} />;
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
