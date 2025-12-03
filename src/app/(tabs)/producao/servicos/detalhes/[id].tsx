import React, { useMemo } from "react";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { ScrollView, View, Alert , StyleSheet} from "react-native";
import { useServiceDetail, useServiceMutations } from "@/hooks";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceInfoCard } from "@/components/production/service/detail/service-info-card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize } from "@/constants/design-system";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";
import { IconEdit, IconTrash, IconLightbulb } from "@tabler/icons-react-native";

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteService } = useServiceMutations();

  const {
    data: serviceResponse,
    isLoading,
    error,
  } = useServiceDetail(id as string);

  const service = serviceResponse?.data;

  // Permission checks
  const canEdit = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const canDelete = useMemo(() => {
    if (!user) return false;
    return hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  }, [user]);

  const handleEdit = () => {
    if (!service) return;
    router.push(`/producao/servicos/editar/${service.id}`);
  };

  const handleDelete = () => {
    if (!service) return;

    Alert.alert(
      "Excluir Serviço",
      `Tem certeza que deseja excluir o serviço "${service.description}"?\n\nEsta ação é irreversível e pode afetar tarefas que utilizam este serviço.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteService(service.id);
              Alert.alert("Sucesso", "Serviço excluído com sucesso", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (_error) {
              Alert.alert("Erro", "Não foi possível excluir o serviço");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
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

  const headerButtons: React.ReactElement[] = [];

  if (canEdit) {
    headerButtons.push(
      <Button
        key="edit"
        variant="ghost"
        size="icon"
        onPress={handleEdit}
      >
        <IconEdit size={20} color={colors.foreground} />
      </Button>
    );
  }

  if (canDelete) {
    headerButtons.push(
      <Button
        key="delete"
        variant="ghost"
        size="icon"
        onPress={handleDelete}
      >
        <IconTrash size={20} color={colors.destructive} />
      </Button>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalhes do Serviço",
          headerBackTitle: "Voltar",
          headerRight: headerButtons.length > 0 ? () => (
            <View style={styles.headerButtons}>
              {headerButtons}
            </View>
          ) : undefined,
        }}
      />

      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Service Information */}
          <ServiceInfoCard service={service} />

          {/* Placeholder for future features */}
          <Card style={styles.card}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <IconLightbulb size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Funcionalidades Futuras</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <ThemedText style={{ color: colors.mutedForeground, lineHeight: 20 }}>
                • Lista de tarefas que utilizam este serviço{"\n"}
                • Estatísticas de uso{"\n"}
                • Serviços relacionados{"\n"}
                • Histórico de alterações
              </ThemedText>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
});