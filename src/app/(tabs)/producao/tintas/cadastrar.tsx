import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { usePaintMutations, usePaintFormulaMutations } from "@/hooks";
import type { PaintCreateFormData } from "@/schemas";
import type { PaintFormula } from "@/types";

export default function CreatePaintScreen() {
  const router = useRouter();
  const { createAsync, isLoading: isPaintLoading } = usePaintMutations();
  const { createAsync: createFormulaAsync, isLoading: isFormulaLoading } = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          // Calculate total weight for ratio conversion
          const totalWeight = formula.components?.reduce((sum, c) => sum + (c.weightInGrams || 0), 0) || 0;

          if (totalWeight > 0 && formula.components && formula.components.length > 0) {
            // Convert weightInGrams to ratio (percentage)
            const componentsWithRatio = formula.components
              .filter((c) => c.itemId && c.weightInGrams && c.weightInGrams > 0)
              .map((c) => ({
                itemId: c.itemId,
                ratio: ((c.weightInGrams || 0) / totalWeight) * 100,
              }));

            // Only create formula if we have valid components
            if (componentsWithRatio.length > 0) {
              const formulaData = {
                description: formula.description || "Fórmula Principal",
                paintId: newPaintId,
                components: componentsWithRatio,
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

      // API client already shows success alert
      router.back();
    } catch (error) {
      console.error("Error creating paint:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
          isSubmitting={isSubmitting || isPaintLoading || isFormulaLoading}
        />
      </ThemedView>
    </>
  );
}
