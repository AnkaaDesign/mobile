import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { usePaintMutations, usePaintFormulaMutations, useScreenReady } from "@/hooks";
import { routeToMobilePath } from '@/utils/route-mapper';
import { routes } from "@/constants";
import type { PaintFormula } from "@/types";
import type { PaintCreateFormData, PaintFormulaCreateFormData } from "@/schemas";

export default function CreateCatalogScreen() {
  const router = useRouter();
  const { createAsync } = usePaintMutations();
  const formulaMutations = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const handleSubmit = async (data: PaintCreateFormData, formulas?: PaintFormula[]) => {
    setIsSubmitting(true);
    try {
      // Create the paint first
      const result = await createAsync(data);

      if (result.success && result.data?.id) {
        const paintId = result.data.id;

        let formulaCreationResults = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        };

        // Create formulas for the newly created paint
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
              paintId: paintId,
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
              "Tinta criada com avisos",
              `Tinta criada com sucesso!\n\nFórmulas criadas: ${formulaCreationResults.success}\nFórmulas com erro: ${formulaCreationResults.failed}\n\nErros:\n${formulaCreationResults.errors.join("\n")}`,
              [{ text: "OK" }]
            );
          }
        }

        // API client already shows success alert
        router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
      }
    } catch (error) {
      // API client already shows error alert
      console.error("Error creating paint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.replace(routeToMobilePath(routes.painting.catalog.root) as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView className="flex-1">
        <PaintForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </ThemedView>
    </>
  );
}
