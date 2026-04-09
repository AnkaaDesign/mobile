import { useState } from "react";
import { Stack, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { usePaintMutations, usePaintFormulaMutations, useScreenReady, useFormScreenKey } from "@/hooks";
import { paintFormulaComponentService, notify } from "@/api-client";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import type { PaintCreateFormData } from "@/schemas";
import type { PaintFormula } from "@/types";

export default function CreatePaintScreen() {
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const { createAsync, isLoading: isPaintLoading } = usePaintMutations();
  const { createAsync: createFormulaAsync, isLoading: isFormulaLoading } = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady(!isPaintLoading);
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: PaintCreateFormData, formulas?: PaintFormula[]) => {
    setIsSubmitting(true);
    try {
      // Step 1: Create the paint
      const paintResult = await createAsync(data);

      if (!paintResult.success || !paintResult.data) {
        throw new Error("Falha ao criar tinta");
      }

      const newPaintId = paintResult.data.id;

      // Step 2: Create formulas if provided
      if (formulas && formulas.length > 0) {
        for (const formula of formulas) {
          if (formula.components && formula.components.length > 0) {
            // Map components with weightInGrams (API expects weight in grams, not ratio)
            const componentsWithWeight = formula.components
              .filter((c) => c.itemId && c.weight && c.weight > 0)
              .map((c) => ({
                itemId: c.itemId,
                weightInGrams: c.weight || 0,
              }));

            // Only create formula if we have valid components
            if (componentsWithWeight.length > 0) {
              const formulaData = {
                description: formula.description || "Fórmula Principal",
                paintId: newPaintId,
                components: componentsWithWeight,
              };

              try {
                await createFormulaAsync(formulaData);
              } catch (formulaError) {
                console.error("Error creating formula:", formulaError);
                // Continue with other formulas even if one fails
              }
            }
          }
        }
      }

      // Deduct stock for all formula components — run in parallel, one summary toast at the end
      const allDeductComponents = (formulas || []).flatMap((formula) =>
        (formula.components || [])
          .filter((c) => c.itemId && c.weight && c.weight > 0)
          .map((c) => ({ itemId: c.itemId, weight: c.weight! }))
      );

      if (allDeductComponents.length > 0) {
        await Promise.allSettled(
          allDeductComponents.map((c) =>
            paintFormulaComponentService.deductForFormulationTest(
              { itemId: c.itemId, weight: c.weight },
              { suppressToast: true },
            )
          )
        );
        notify.success("Estoque atualizado", `${allDeductComponents.length} componente(s) deduzido(s) do estoque`);
      }

      goBack();
    } catch (error) {
      console.error("Error creating paint:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    goBack();
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
          key={formKey}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting || isPaintLoading || isFormulaLoading}
        />
      </ThemedView>
    </>
  );
}
