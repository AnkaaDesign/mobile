import React, { useMemo } from "react";
import { Stack, router } from "expo-router";
import { Alert } from "react-native";
import { useServiceMutations } from '../../../../hooks';
import { ServiceForm } from "@/components/production/service/form/service-form";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../constants';
import type { ServiceCreateFormData } from '../../../../schemas';

export default function CreateServiceScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { createAsync, createMutation } = useServiceMutations();

  // Permission check - Only admins can create services
  const canCreate = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const handleSubmit = async (data: ServiceCreateFormData) => {
    try {
      const result = await createAsync(data);

      Alert.alert(
        "Sucesso",
        "Serviço criado com sucesso!",
        [
          {
            text: "Ver Serviço",
            onPress: () => {
              router.replace(`/production/services/details/${result.data.id}`);
            }
          },
          {
            text: "Criar Outro",
            onPress: () => {
              // Stay on create screen
            }
          },
          {
            text: "Voltar à Lista",
            onPress: () => {
              router.replace("/production/services/list");
            }
          }
        ]
      );
    } catch (error) {
      // Error is handled by the API client and mutation
      console.error("Error creating service:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Permission gate
  if (!canCreate) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Criar Serviço",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para criar serviços. É necessário privilégio de Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Criar Serviço",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerBackTitle: "Voltar",
        }}
      />

      <ServiceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}