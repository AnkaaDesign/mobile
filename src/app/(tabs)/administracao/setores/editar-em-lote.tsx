import { useState, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconBuildingSkyscraper, IconDeviceFloppy } from "@tabler/icons-react-native";
import { useSectors, useSectorBatchMutations } from "@/hooks";
import type { Sector } from '../../../../types';
import { ThemedView, ThemedText, Button, LoadingScreen } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { routes } from "@/constants";
import { routeToMobilePath } from "@/lib/route-mapper";
import { toast } from "@/lib/toast";

export default function SectorBatchEditScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get selected IDs from URL params
  const selectedIds = useMemo(() => {
    const ids = params.ids as string;
    if (!ids) return [];
    return ids.split(",").filter(Boolean);
  }, [params.ids]);

  // Fetch selected sectors
  const { data, isLoading } = useSectors({
    where: {
      id: { in: selectedIds },
    },
    limit: 100,
  });

  const { batchUpdateAsync: batchUpdate } = useSectorBatchMutations();

  useEffect(() => {
    if (data?.data) {
      setSectors(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      router.push(routeToMobilePath(routes.administration.sectors.root) as any);
    }
  }, [selectedIds, router]);

  const handleCancel = () => {
    router.push(routeToMobilePath(routes.administration.sectors.root) as any);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await batchUpdate(data);

      if (result.data) {
        toast.success(`${result.data.totalSuccess} setor${result.data.totalSuccess !== 1 ? 'es' : ''} processado${result.data.totalSuccess !== 1 ? 's' : ''}`);

        if (result.data.totalFailed > 0) {
          toast.error(`${result.data.totalFailed} setor${result.data.totalFailed !== 1 ? 'es' : ''} falhou ao atualizar`);
        }
      }

      router.push(routeToMobilePath(routes.administration.sectors.root) as any);
    } catch (error) {
      toast.error("Erro ao atualizar setores");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando setores..." />;
  }

  if (sectors.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <IconBuildingSkyscraper size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            Nenhum setor selecionado
          </ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
            Nenhum setor selecionado para edição em lote.
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
            Edição em Lote de Setores
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            {sectors.length} setor{sectors.length !== 1 ? 'es' : ''} selecionado{sectors.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Batch Edit Form would go here */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
            Campos Comuns
          </ThemedText>
          <ThemedText style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Edite os campos que deseja alterar em todos os setores selecionados.
          </ThemedText>
          {/* Form fields would be implemented here based on SectorBatchEditTable component */}
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
