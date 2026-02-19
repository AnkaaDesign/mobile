import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
// import { showToast } from "@/components/ui/toast";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { PaintForm } from "@/components/painting/forms/painting-form";
import { FormSkeleton } from "@/components/ui/form-skeleton";
import { usePaint, usePaintMutations, usePaintFormulaMutations, useScreenReady } from "@/hooks";
import { spacing } from "@/constants/design-system";
import type { PaintUpdateFormData } from "@/schemas";
import type { PaintFormula } from "@/types";

export default function EditPaintScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateAsync, isLoading: isPaintLoading } = usePaintMutations();
  const { createAsync: createFormulaAsync, isLoading: isFormulaLoading } = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      formulas: {
        include: {
          components: {
            include: {
              item: true,
            },
          },
        },
      },
    },
  });

  // End navigation loading overlay when screen mounts
  useScreenReady(!isLoadingPaint);

  const paint = response?.data;

  const handleSubmit = async (data: PaintUpdateFormData, newFormulas?: PaintFormula[]) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      // Step 1: Update the paint
      const result = await updateAsync({ id, data });

      if (!result.success) {
        throw new Error("Falha ao atualizar tinta");
      }

      // Step 2: Create new formulas if provided
      if (newFormulas && newFormulas.length > 0) {
        for (const formula of newFormulas) {
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
                paintId: id,
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

      // API client already shows success alert
      router.back();
    } catch (error) {
      console.error("Error updating paint:", error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
          <FormSkeleton
            cards={[
              { title: true, titleWidth: "50%", fields: 2 },
              { title: true, titleWidth: "35%", fields: 3 },
            ]}
            showActionBar
          />
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
          existingFormulas={paint.formulas}
          initialGrounds={paint.paintGrounds?.map((g) => g.groundPaint).filter(Boolean) as any}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting || isPaintLoading || isFormulaLoading}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
