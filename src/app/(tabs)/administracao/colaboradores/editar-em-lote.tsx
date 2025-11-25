import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconUsers, IconDeviceFloppy } from "@tabler/icons-react-native";
import { useUsers, useUserBatchMutations } from "@/hooks";
import { ThemedView, ThemedText, Button, ErrorScreen, LoadingScreen } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from '@/utils/route-mapper';
import { toast } from "@/lib/toast";

export default function CollaboratorBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get selected IDs from URL params
  const selectedIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch all selected users with their relationships
  const {
    data: usersData,
    isLoading,
    error,
  } = useUsers({
    where: {
      id: { in: selectedIds },
    },
    include: {
      position: true,
      sector: true,
      managedSector: true,
    },
  });

  const { batchUpdateAsync: batchUpdate } = useUserBatchMutations();

  const users = useMemo(() => {
    if (!usersData?.data) return [];
    // Ensure users are returned in the same order as selectedIds
    const userMap = new Map(usersData.data.map((user) => [user.id, user]));
    return selectedIds.map((id) => userMap.get(id)).filter(Boolean);
  }, [usersData, selectedIds]);

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.administration.collaborators.root) as any);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await batchUpdate(data);

      if (result.data) {
        toast.success(`${result.data.totalSuccess} colaborador${result.data.totalSuccess !== 1 ? 'es' : ''} atualizado${result.data.totalSuccess !== 1 ? 's' : ''}`);

        if (result.data.totalFailed > 0) {
          toast.error(`${result.data.totalFailed} colaborador${result.data.totalFailed !== 1 ? 'es' : ''} falhou ao atualizar`);
        }
      }

      router.push(routeToMobilePath(routes.administration.collaborators.root) as any);
    } catch (error) {
      toast.error("Erro ao atualizar colaboradores");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando colaboradores..." />;
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorScreen
          message="Erro ao carregar colaboradores"
          detail="Não foi possível carregar os colaboradores selecionados. Por favor, tente novamente."
          onRetry={() => router.back()}
        />
      </ThemedView>
    );
  }

  if (selectedIds.length === 0 || users.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconUsers size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum colaborador selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Por favor, selecione pelo menos um colaborador para editar em lote.
          </ThemedText>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.button}
          >
            Voltar
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: colors.foreground }]}>
            Editar Colaboradores em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {users.length} colaborador{users.length !== 1 ? 'es' : ''} selecionado{users.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Batch Edit Form would go here */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos Comuns
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Edite os campos que deseja alterar em todos os colaboradores selecionados.
          </ThemedText>
          {/* Form fields would be implemented here based on UserBatchEditTable component */}
        </View>

        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            disabled={isSubmitting}
            style={styles.footerButton}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onPress={() => handleSubmit({})}
            disabled={isSubmitting}
            icon={<IconDeviceFloppy size={20} color={colors.primaryForeground} />}
            style={styles.footerButton}
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    minWidth: 120,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  footerButton: {
    flex: 1,
  },
});
