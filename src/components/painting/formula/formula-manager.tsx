import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paintFormulaCreateSchema, type PaintFormulaCreateFormData } from "../../../schemas";
import type { PaintFormula, Item } from "../../../types";
import { FormulaComponentsEditor } from "./formula-components-editor";
import { FormulaSampler } from "./formula-sampler";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";

interface FormulaManagerProps {
  formulas: PaintFormula[];
  onFormulasChange: (formulas: PaintFormula[]) => void;
  paintId?: string;
  availableItems?: Item[];
}

export function FormulaManager({ formulas, onFormulasChange, paintId, availableItems = [] }: FormulaManagerProps) {
  const { colors } = useTheme();
  const keyboardContext = useKeyboardAwareForm();

  // Ensure we always have at least one formula ready
  useEffect(() => {
    if (formulas.length === 0) {
      const newFormula = {
        id: `temp-${Date.now()}`,
        description: "Fórmula Principal",
        paintId: paintId || "",
        density: 1.0,
        pricePerLiter: 0,
        components: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaintFormula;
      onFormulasChange([newFormula]);
    }
  }, [formulas.length, onFormulasChange, paintId]);

  // In update mode, don't pre-fill formula fields - they should be empty for adding new formulas
  const form = useForm<PaintFormulaCreateFormData>({
    resolver: zodResolver(paintFormulaCreateSchema),
    defaultValues: {
      description: "Fórmula Principal",
      paintId: paintId || "",
      components: [], // Always start with empty components for new formulas
    },
  });

  // Auto-update formula when form values change
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (formulas.length > 0) {
        // Calculate total weight for ratio conversion
        const totalWeight = data.components?.reduce((sum, c) => sum + (c?.weightInGrams || 0), 0) || 0;

        const updatedFormula = {
          ...formulas[0],
          description: data.description || "Fórmula Principal",
          components:
            data.components?.map((c, index) => {
              // Convert weightInGrams to ratio for display/storage
              const ratio = totalWeight > 0 ? ((c?.weightInGrams || 0) / totalWeight) * 100 : 0;
              const component = {
                id: formulas[0].components?.[index]?.id || `temp-comp-${Date.now()}-${index}`,
                itemId: c?.itemId || "",
                formulaPaintId: formulas[0].id || "",
                weightInGrams: c?.weightInGrams || 0, // Preserve the original weight
                ratio: ratio,
                createdAt: formulas[0].components?.[index]?.createdAt || new Date(),
                updatedAt: new Date(),
              };
              return component;
            }) || [],
        };

        onFormulasChange([updatedFormula]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, formulas, onFormulasChange]);

  return (
    <FormProvider {...form}>
      <View style={styles.container}>
        {/* Formula Description - with extra top spacing */}
        <View
          style={styles.descriptionSection}
          onLayout={keyboardContext ? (e) => keyboardContext.onFieldLayout('formulaDescription', e) : undefined}
        >
          <Label>
            Descrição da Fórmula <Text style={{ color: colors.destructive }}>*</Text>
          </Label>
          <Input
            placeholder="Ex: Fórmula Principal, Variação Clara, etc."
            value={form.watch("description")}
            onChangeText={(value) => form.setValue("description", value || "")}
            style={form.formState.errors.description ? { borderColor: colors.destructive } : undefined}
            onFocus={() => keyboardContext?.onFieldFocus('formulaDescription')}
          />
          {form.formState.errors.description && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {form.formState.errors.description.message}
            </Text>
          )}
        </View>

        {/* Components Editor */}
        <View style={styles.section}>
          <Label>Componentes da Fórmula</Label>
          <View style={styles.editorContainer}>
            <FormulaComponentsEditor availableItems={availableItems} formulaPaintId={formulas[0]?.id} />
          </View>
          {form.formState.errors.components && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {form.formState.errors.components.message}
            </Text>
          )}
        </View>

        {/* Formula Sampler */}
        <View style={styles.section}>
          <FormulaSampler availableItems={availableItems} />
        </View>
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  descriptionSection: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  editorContainer: {
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
