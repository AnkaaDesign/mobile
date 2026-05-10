import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePaint,
  usePaintMutations,
  usePaintFormulaMutations,
  useScreenReady,
} from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import type { PaintFormula } from "@/types";
import type { PaintUpdateFormData, PaintFormulaCreateFormData } from "@/schemas";
import { paintFormulaComponentService, notify } from "@/api-client";
import { PrivilegeGate } from "@/components/auth/privilege-gate";

export default function EditCatalogScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <EditCatalogScreenInner />
    </PrivilegeGate>
  );
}

function EditCatalogScreenInner() {
  const nav = useNav();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { updateAsync } = usePaintMutations();
  const formulaMutations = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: response,
    isLoading: isLoadingPaint,
    error,
  } = usePaint(id!, {
    include: {
      paintType: true,
      paintBrand: true,
      paintGrounds: { include: { groundPaint: true } },
    },
  });

  useScreenReady(!isLoadingPaint);

  const paint = response?.data;

  const handleSubmit = async (data: PaintUpdateFormData, formulas?: PaintFormula[]) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const result = await nav.withLoading(async () => updateAsync({ id, data }));

      if (result.success) {
        const formulaCreationResults = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        if (formulas && formulas.length > 0) {
          for (const formula of formulas) {
            const validComponents =
              formula.components?.filter((c) => c.itemId && c.weightInGrams && c.weightInGrams > 0) || [];

            if (validComponents.length === 0) {
              formulaCreationResults.failed++;
              formulaCreationResults.errors.push(
                `Fórmula "${formula.description || "Sem descrição"}" não tem componentes válidos`,
              );
              continue;
            }

            const formulaData: PaintFormulaCreateFormData = {
              paintId: id,
              description: formula.description || "Fórmula Principal",
              components: validComponents.map((c) => ({
                itemId: c.itemId,
                weightInGrams: c.weightInGrams!,
              })),
            };

            try {
              await formulaMutations.createAsync(formulaData);
              formulaCreationResults.success++;
            } catch (error: any) {
              formulaCreationResults.failed++;
              const errorMessage = error.message || "Erro desconhecido";
              formulaCreationResults.errors.push(
                `Fórmula "${formula.description || "Sem descrição"}": ${errorMessage}`,
              );
            }
          }

          if (formulaCreationResults.failed > 0) {
            Alert.alert(
              "Tinta atualizada com avisos",
              `Tinta atualizada com sucesso!\n\nFórmulas criadas: ${formulaCreationResults.success}\nFórmulas com erro: ${formulaCreationResults.failed}\n\nErros:\n${formulaCreationResults.errors.join("\n")}`,
              [{ text: "OK" }],
            );
          }
        }

        // Deduct stock for new formula components.
        const allDeductComponents = (formulas || []).flatMap((formula) =>
          (formula.components || [])
            .filter((c) => c.itemId && c.weightInGrams && c.weightInGrams > 0)
            .map((c) => ({ itemId: c.itemId, weight: c.weightInGrams! })),
        );

        if (allDeductComponents.length > 0) {
          await Promise.allSettled(
            allDeductComponents.map((c) =>
              paintFormulaComponentService.deductForFormulationTest(
                { itemId: c.itemId, weight: c.weight },
                { suppressToast: true },
              ),
            ),
          );
          notify.success(
            "Estoque atualizado",
            `${allDeductComponents.length} componente(s) deduzido(s) do estoque`,
          );
        }

        nav.replace(mobileRoute(routes.painting.catalog.details(id)));
      }
    } catch (error) {
      console.error("Error updating paint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    nav.replace(mobileRoute(routes.painting.catalog.details(id!)));
  };

  if (isLoadingPaint) {
    return (
      <>
        <Stack.Screen options={{ title: "Editar Tinta", headerBackTitle: "Voltar" }} />
        <ThemedView style={styles.container}>
          <View style={styles.skeletonContainer}>
            <View
              style={[
                styles.skeleton,
                {
                  backgroundColor: colors.card,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 16,
                  gap: 12,
                },
              ]}
            >
              <Skeleton style={{ height: 14, width: "30%", borderRadius: 4 }} />
              <Skeleton style={{ height: 40, borderRadius: 6 }} />
              <Skeleton style={{ height: 14, width: "20%", borderRadius: 4 }} />
              <Skeleton style={{ height: 40, borderRadius: 6 }} />
            </View>
          </View>
        </ThemedView>
      </>
    );
  }

  if (error || !paint) {
    return (
      <>
        <Stack.Screen options={{ title: "Editar Tinta", headerBackTitle: "Voltar" }} />
        <ThemedView style={{ flex: 1 }}>
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorTitle}>Tinta não encontrada</ThemedText>
            <ThemedText style={styles.errorDescription}>
              A tinta que você está procurando não existe ou foi removida.
            </ThemedText>
            <Button onPress={handleCancel}>
              <ThemedText style={{ color: "white" }}>Voltar para lista</ThemedText>
            </Button>
          </View>
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Editar Tinta", headerBackTitle: "Voltar" }} />
      <ThemedView style={{ flex: 1 }}>
        <PaintForm
          key={id}
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
          initialGrounds={
            paint.paintGrounds
              ?.map((g) => g.groundPaint)
              .filter((g): g is NonNullable<typeof g> => g !== undefined) || []
          }
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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    textAlign: "center",
    opacity: 0.7,
  },
});
