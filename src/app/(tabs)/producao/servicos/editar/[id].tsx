import { useMemo } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Alert } from "react-native";
import { useServiceDetail, useServiceMutations } from '../../../../../hooks';
import { ServiceForm } from "@/components/production/service/form/service-form";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { hasPrivilege } from '../../../../../utils';
import { SECTOR_PRIVILEGES } from '../../../../../constants';
import type { ServiceUpdateFormData } from '../../../../../schemas';

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, updateMutation } = useServiceMutations();

  const {
    data: serviceResponse,
    isLoading,
    error,
  } = useServiceDetail(id as string);

  const service = serviceResponse?.data;

  // Permission check - Only admins can edit services
  const canEdit = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const handleSubmit = async (data: ServiceUpdateFormData) => {
    if (!service) return;

    try {
      await update({ id: service.id, data });

      Alert.alert(
        "Sucesso",
        "Serviço atualizado com sucesso!",
        [
          {
            text: "Ver Serviço",
            onPress: () => {
              router.replace(`/production/services/details/${service.id}` as any);
            }
          },
          {
            text: "Continuar Editando",
            onPress: () => {
              // Stay on edit screen
            }
          }
        ]
      );
    } catch (error) {
      // Error is handled by the API client and mutation
      console.error("Error updating service:", error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // Show loading while fetching service data
  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  // Show error if service not found or error occurred
  if (error || !service) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          message="Erro ao carregar serviço"
          detail={error?.message || "Serviço não encontrado"}
          onRetry={() => window.location.reload()}
        />
      </>
    );
  }

  // Permission gate
  if (!canEdit) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Serviço",
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.foreground,
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen
          message="Acesso negado"
          detail="Você não tem permissão para editar serviços. É necessário privilégio de Administrador."
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Serviço",
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.foreground,
          headerBackTitle: "Voltar",
        }}
      />

      <ServiceForm
        service={service}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
}