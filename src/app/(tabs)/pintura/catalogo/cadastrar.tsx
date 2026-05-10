import { useState } from "react";
import { Stack } from "expo-router";
import { Alert } from "react-native";
import { ThemedView } from "@/components/ui/themed-view";
import { PaintForm } from "@/components/painting/forms/painting-form";
import {
  usePaintMutations,
  usePaintFormulaMutations,
  useScreenReady,
  useFormScreenKey,
} from "@/hooks";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import type { PaintFormula } from "@/types";
import type { PaintCreateFormData, PaintFormulaCreateFormData } from "@/schemas";
import { paintFormulaComponentService, notify } from "@/api-client";
import { PrivilegeGate } from "@/components/auth/privilege-gate";

export default function CreateCatalogScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <CreateCatalogScreenInner />
    </PrivilegeGate>
  );
}

function CreateCatalogScreenInner() {
  const nav = useNav();
  const { createAsync } = usePaintMutations();
  const formulaMutations = usePaintFormulaMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useScreenReady();
  const formKey = useFormScreenKey();

  const handleSubmit = async (data: PaintCreateFormData, formulas?: PaintFormula[]) => {
    setIsSubmitting(true);
    try {
      const result = await nav.withLoading(async () => createAsync(data));

      if (result.success && result.data?.id) {
        const paintId = result.data.id;

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
              paintId,
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
              "Tinta criada com avisos",
              `Tinta criada com sucesso!\n\nFórmulas criadas: ${formulaCreationResults.success}\nFórmulas com erro: ${formulaCreationResults.failed}\n\nErros:\n${formulaCreationResults.errors.join("\n")}`,
              [{ text: "OK" }],
            );
          }
        }

        // Deduct stock for all formula components — run in parallel.
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

        nav.replace(mobileRoute(routes.painting.catalog.details(paintId)));
      }
    } catch (error) {
      console.error("Error creating paint:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    nav.goBack({ fallback: mobileRoute(routes.painting.catalog.root) });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Cadastrar Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ThemedView style={{ flex: 1 }}>
        <PaintForm
          key={formKey}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </ThemedView>
    </>
  );
}
