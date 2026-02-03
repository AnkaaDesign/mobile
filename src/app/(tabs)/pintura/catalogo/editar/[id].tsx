import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { SkeletonCard } from "@/components/ui/loading";
import { usePaint, usePaintMutations, usePaintFormulaMutations, useScreenReady } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import { spacing } from "@/constants/design-system";
import type { PaintFormula } from "@/types";
import type { PaintUpdateFormData, PaintFormulaCreateFormData } from "@/schemas";

export default function EditCatalogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync } = usePaintMutations();
  const formulaMutations = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const {
    data: response,
    isLoading: isLoadingPaint,
    error,
  } = usePaint(id!, {
    include: {
      paintType: true,
      paintBrand: true,
      paintGrounds: {
        include: {
          groundPaint: true,
        },
      },
    },
  });

  const paint = response?.data;

  const handleSubmit = async (data: PaintUpdateFormData, formulas?: PaintFormula[]) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const result = await updateAsync({ id, data });

      if (result.success) {
        let formulaCreationResults = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        // Create new formulas if any
        if (formulas && formulas.length > 0) {
          for (const formula of formulas) {
            const validComponents = formula.components?.filter((c) => {
              return c.itemId && c.weightInGrams && c.weightInGrams > 0;
            }) || [];

            if (validComponents.length === 0) {
              formulaCreationResults.failed++;
              formulaCreationResults.errors.push(`Fórmula "${formula.description || "Sem descrição"}" não tem componentes válidos`);
              continue;
            }

            const formulaData: PaintFormulaCreateFormData = {
              paintId: id,
              description: formula.description || "Fórmula Principal",
              components: validComponents.map((c) => ({
                itemId: c.itemId,
                weightInGrams: c.weightInGrams, // Backend will calculate ratio from weight
              })),
            };

            try {
              await formulaMutations.createAsync(formulaData);
              formulaCreationResults.success++;
            } catch (error: any) {
              formulaCreationResults.failed++;
              const errorMessage = error.message || "Erro desconhecido";
              formulaCreationResults.errors.push(`Fórmula "${formula.description || "Sem descrição"}": ${errorMessage}`);
            }
          }

          // Show formula creation results if there were any issues
          if (formulaCreationResults.failed > 0) {
            Alert.alert(
              "Tinta atualizada com avisos",
              `Tinta atualizada com sucesso!\n\nFórmulas criadas: ${formulaCreationResults.success}\nFórmulas com erro: ${formulaCreationResults.failed}\n\nErros:\n${formulaCreationResults.errors.join("\n")}`,
              [{ text: "OK" }]
            );
          }
        }

        // API client already shows success alert
        router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error updating paint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
  };

  if (isLoadingPaint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Tinta",
            headerBackTitle: "Voltar",
          }}
        />
        <ThemedView style={styles.container}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard style={styles.skeleton} />
            <SkeletonCard style={styles.skeleton} />
            <SkeletonCard style={styles.skeleton} />
          </View>
        </ThemedView>
      </>
    );
  }

  if (error || !paint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Editar Tinta",
            headerBackTitle: "Voltar",
          }}
        />
        <ThemedView className="flex-1">
          <View className="flex-1 items-center justify-center px-4">
            <ThemedText className="text-2xl font-semibold mb-2 text-center">Tinta não encontrada</ThemedText>
            <ThemedText className="text-muted-foreground mb-4 text-center">
              A tinta que você está procurando não existe ou foi removida.
            </ThemedText>
            <Button onPress={handleCancel}>
              <ThemedText className="text-white">Voltar para lista</ThemedText>
            </Button>
          </View>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Editar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView className="flex-1">
        <PaintForm
          mode="update"
          paintId={id!}
          defaultValues={{
            name: paint.name,
            code: paint.code,
            hex: paint.hex,
            finish: paint.finish,
            paintTypeId: paint.paintTypeId,
            paintBrandId: paint.paintBrandId,
            manufacturer: paint.manufacturer,
            tags: paint.tags || [],
            groundIds: paint.paintGrounds?.map((g) => g.groundPaintId) || [],
          }}
          initialGrounds={paint.paintGrounds?.map((g) => g.groundPaint).filter((g): g is NonNullable<typeof g> => g !== undefined) || []}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  skeleton: {
    height: 200,
  },
});
