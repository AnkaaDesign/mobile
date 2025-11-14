import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconUsers, IconDeviceFloppy } from "@tabler/icons-react-native";
import { useCustomers, useCustomerBatchMutations } from "@/hooks";

import { ThemedView, ThemedText, Button, LoadingScreen } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { toast } from "@/lib/toast";

export default function CustomerBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get customer IDs from URL params
  const customerIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch customers to edit
  const {
    data: customersResponse,
    isLoading,
    error,
  } = useCustomers(
    {
      where: {
        id: { in: customerIds },
      },
      include: {
        logo: true,
        count: true,
      },
    },
    {
      enabled: customerIds.length > 0,
    }
  );

  const { batchUpdateAsync: batchUpdate } = useCustomerBatchMutations();

  const customers = customersResponse?.data || [];
  const hasValidCustomers = customers.length > 0;
  const allCustomersFound = customers.length === customerIds.length;

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.administration.customers.root) as any);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await batchUpdate(data);

      if (result.data) {
        toast.success(`${result.data.totalSuccess} cliente${result.data.totalSuccess !== 1 ? 's' : ''} atualizado${result.data.totalSuccess !== 1 ? 's' : ''}`);

        if (result.data.totalFailed > 0) {
          toast.error(`${result.data.totalFailed} cliente${result.data.totalFailed !== 1 ? 's' : ''} falhou ao atualizar`);
        }
      }

      router.push(routeToMobilePath(routes.administration.customers.root) as any);
    } catch (error) {
      toast.error("Erro ao atualizar clientes");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (customerIds.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconUsers size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum Cliente Selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhum cliente foi selecionado para edição em lote.
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

  if (isLoading) {
    return <LoadingScreen message="Carregando clientes..." />;
  }

  if (error || !hasValidCustomers) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconUsers size={48} color={colors.destructive} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Erro ao Carregar Clientes
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            {error ? "Ocorreu um erro ao carregar os clientes selecionados." : "Os clientes selecionados não foram encontrados."}
          </ThemedText>
          {!allCustomersFound && customers.length > 0 && (
            <View style={[styles.warningCard, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
              <ThemedText style={[styles.warningText, { color: colors.warning }]}>
                Apenas {customers.length} de {customerIds.length} clientes foram encontrados. Os clientes não encontrados podem ter sido excluídos.
              </ThemedText>
            </View>
          )}
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
            Editar Clientes em Lote
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {customers.length} cliente{customers.length !== 1 ? 's' : ''} selecionado{customers.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Batch Edit Form would go here */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos Comuns
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Edite os campos que deseja alterar em todos os clientes selecionados.
          </ThemedText>
          {/* Form fields would be implemented here based on CustomerBatchEditTable component */}
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
  warningCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    textAlign: "center",
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
