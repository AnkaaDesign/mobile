import { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormSteps, type FormStep } from "@/components/ui/form-steps";

import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { paintCreateSchema, paintUpdateSchema, type PaintCreateFormData, type PaintUpdateFormData } from '../../../schemas';
import { usePaintTypes, usePaintBrands, usePaints, usePaintType, useAvailableComponents } from "@/hooks";
import { PAINT_FINISH, COLOR_PALETTE, TRUCK_MANUFACTURER } from "@/constants";
import { IconLoader } from "@tabler/icons-react-native";
import type { PaintFormula, Paint } from "../../../types";
import { FormulaManager } from "../formula/formula-manager";

interface BaseFormProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  onStepChange?: (step: number) => void;
  onPaintTypeChange?: (paintTypeId: string) => void;
  currentStep?: number;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

interface CreateFormProps extends BaseFormProps {
  mode: "create";
  onSubmit: (data: PaintCreateFormData, formulas?: PaintFormula[]) => Promise<void>;
  defaultValues?: Partial<PaintCreateFormData>;
}

interface UpdateFormProps extends BaseFormProps {
  mode: "update";
  onSubmit: (data: PaintUpdateFormData, newFormulas?: PaintFormula[]) => Promise<void>;
  defaultValues?: Partial<PaintUpdateFormData>;
  existingFormulas?: PaintFormula[];
  paintId: string;
  initialGrounds?: Paint[];
}

type PaintFormProps = CreateFormProps | UpdateFormProps;

// Define steps (matching web version)
const steps: FormStep[] = [
  { id: 1, name: "Informações Básicas", description: "Dados principais da tinta" },
  { id: 2, name: "Formulação", description: "Componentes e fórmulas (opcional)" },
  { id: 3, name: "Fundo da Tinta", description: "Selecione os fundos necessários" },
];

const FINISH_OPTIONS = [
  { value: PAINT_FINISH.METALLIC, label: "Metálico" },
  { value: PAINT_FINISH.SOLID, label: "Sólido" },
  { value: PAINT_FINISH.PEARL, label: "Perolizado" },
  { value: PAINT_FINISH.MATTE, label: "Fosco" },
  { value: PAINT_FINISH.SATIN, label: "Acetinado" },
];

const PALETTE_OPTIONS = [
  { value: COLOR_PALETTE.WHITE, label: "Branco" },
  { value: COLOR_PALETTE.BLACK, label: "Preto" },
  { value: COLOR_PALETTE.GRAY, label: "Cinza" },
  { value: COLOR_PALETTE.SILVER, label: "Prata" },
  { value: COLOR_PALETTE.RED, label: "Vermelho" },
  { value: COLOR_PALETTE.BLUE, label: "Azul" },
  { value: COLOR_PALETTE.GREEN, label: "Verde" },
  { value: COLOR_PALETTE.YELLOW, label: "Amarelo" },
  { value: COLOR_PALETTE.ORANGE, label: "Laranja" },
  { value: COLOR_PALETTE.BROWN, label: "Marrom" },
  { value: COLOR_PALETTE.BEIGE, label: "Bege" },
  { value: COLOR_PALETTE.GOLDEN, label: "Dourado" },
  { value: COLOR_PALETTE.PINK, label: "Rosa" },
  { value: COLOR_PALETTE.PURPLE, label: "Roxo" },
];

const MANUFACTURER_OPTIONS = [
  { value: TRUCK_MANUFACTURER.VOLKSWAGEN, label: "Volkswagen" },
  { value: TRUCK_MANUFACTURER.MERCEDES_BENZ, label: "Mercedes-Benz" },
  { value: TRUCK_MANUFACTURER.SCANIA, label: "Scania" },
  { value: TRUCK_MANUFACTURER.VOLVO, label: "Volvo" },
  { value: TRUCK_MANUFACTURER.IVECO, label: "Iveco" },
  { value: TRUCK_MANUFACTURER.DAF, label: "DAF" },
];

export function PaintForm(props: PaintFormProps) {
  const { defaultValues, mode, onStepChange, onPaintTypeChange, isSubmitting, onCancel } = props;
  const { colors } = useTheme();

  // Step management (matching web version)
  const [currentStep, setCurrentStep] = useState(props.currentStep || 1);
  const [formulas, setFormulas] = useState<PaintFormula[]>([]);

  // Search states
  const [paintTypeSearch, setPaintTypeSearch] = useState("");
  const [paintBrandSearch, setPaintBrandSearch] = useState("");
  const [groundPaintSearch, setGroundPaintSearch] = useState("");

  // Sync currentStep from props
  useEffect(() => {
    if (props.currentStep !== undefined && props.currentStep !== currentStep) {
      setCurrentStep(props.currentStep);
    }
  }, [props.currentStep, currentStep]);

  // Default values for create mode
  const createDefaults: PaintCreateFormData = {
    name: "",
    hex: "#000000",
    finish: "SOLID",
    paintBrandId: null,
    manufacturer: null,
    tags: [],
    palette: undefined,
    paletteOrder: undefined,
    paintTypeId: "",
    groundIds: [],
    ...defaultValues,
  };

  const form = useForm<PaintCreateFormData | PaintUpdateFormData>({
    resolver: zodResolver(mode === "create" ? paintCreateSchema : paintUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : defaultValues,
    mode: "onTouched", // Validate on blur
  });

  // Fetch paint types
  const { data: paintTypes, isLoading: isLoadingTypes } = usePaintTypes({
    searchingFor: paintTypeSearch,
    orderBy: { name: "asc" },
  });

  // Fetch paint brands
  const { data: paintBrands, isLoading: isLoadingBrands } = usePaintBrands({
    searchingFor: paintBrandSearch,
    orderBy: { name: "asc" },
  });

  // Fetch paints for ground selection
  const { data: paints, isLoading: isLoadingPaints } = usePaints({
    searchingFor: groundPaintSearch,
    orderBy: { name: "asc" },
  });

  // Watch paint type and paint brand selection for dual filtering (matching web)
  const paintTypeId = form.watch("paintTypeId");
  const paintBrandId = form.watch("paintBrandId");

  // Get paint type details for ground requirements (matching web)
  const { data: paintType } = usePaintType(paintTypeId || "", {
    enabled: !!paintTypeId,
  });

  // Get component items filtered by intersection of paint brand and paint type (matching web)
  const { data: availableComponentsResponse } = useAvailableComponents({
    paintBrandId: paintBrandId || undefined,
    paintTypeId: paintTypeId || undefined,
    enabled: !!paintBrandId && !!paintTypeId, // Only fetch when both are selected
  });

  // Notify parent when paint type changes (matching web)
  useEffect(() => {
    if (paintTypeId && onPaintTypeChange) {
      onPaintTypeChange(paintTypeId);
    }
  }, [paintTypeId, onPaintTypeChange]);

  // Sort component items returned from the backend (matching web)
  const sortedComponentItems = useMemo(() => {
    if (!availableComponentsResponse?.data) return [];

    // Backend returns items that exist in BOTH paint brand AND paint type
    // Just sort them by unicode, then by name
    return [...availableComponentsResponse.data].sort((a, b) => {
      const aUnicode = a.uniCode || "";
      const bUnicode = b.uniCode || "";

      if (aUnicode && bUnicode) {
        return aUnicode.localeCompare(bUnicode);
      }
      if (aUnicode && !bUnicode) return -1;
      if (!aUnicode && bUnicode) return 1;

      // If both don't have unicode, sort by name
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [availableComponentsResponse?.data]);

  const paintTypeOptions = paintTypes?.data?.map((type) => ({
    value: type.id,
    label: type.name,
  })) || [];

  const paintBrandOptions = paintBrands?.data?.map((brand) => ({
    value: brand.id,
    label: brand.name,
  })) || [];

  const groundPaintOptions = paints?.data?.map((paint) => ({
    value: paint.id,
    label: paint.name,
  })) || [];

  // Filter steps based on whether paint type needs ground (matching web)
  const availableSteps = useMemo(() => {
    if (paintType?.data?.needGround) {
      return steps;
    }
    // If paint type doesn't need ground, exclude step 3
    return steps.filter((step) => step.id !== 3);
  }, [paintType?.data?.needGround]);

  // Step validation (matching web)
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        // Validate basic information fields
        const step1Valid = await form.trigger(["name", "paintTypeId", "paintBrandId", "finish", "hex"]);

        if (!step1Valid) {
          return false;
        }

        // Additional custom validation for name trimming
        const values = form.getValues();
        if (!values.name?.trim()) {
          form.setError("name", { type: "manual", message: "Nome da tinta não pode ser vazio" });
          return false;
        }

        return true;

      case 2:
        // Formula step is optional, always allow progression
        return true;

      case 3:
        // Ground selection validation
        if (paintType?.data?.needGround) {
          const groundValid = await form.trigger("groundIds");
          if (!groundValid) {
            return false;
          }

          const groundValues = form.getValues();
          if (!groundValues.groundIds || groundValues.groundIds.length === 0) {
            form.setError("groundIds", { type: "manual", message: "Selecione pelo menos um fundo" });
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  }, [currentStep, form, paintType]);

  // Navigation functions (matching web)
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      return;
    }

    const currentIndex = availableSteps.findIndex((step) => step.id === currentStep);
    if (currentIndex < availableSteps.length - 1) {
      const newStep = availableSteps[currentIndex + 1].id;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [validateCurrentStep, availableSteps, currentStep, onStepChange]);

  const prevStep = useCallback(() => {
    const currentIndex = availableSteps.findIndex((step) => step.id === currentStep);
    if (currentIndex > 0) {
      const newStep = availableSteps[currentIndex - 1].id;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [availableSteps, currentStep, onStepChange]);

  const handleSubmit = async (data: PaintCreateFormData | PaintUpdateFormData) => {
    if (mode === "create") {
      // Filter valid formulas to pass to the parent
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.ratio > 0));
      await (props as CreateFormProps).onSubmit(data as PaintCreateFormData, validFormulas);
    } else {
      // In update mode, also handle new formulas if any
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.ratio > 0));
      await (props as UpdateFormProps).onSubmit(data as PaintUpdateFormData, validFormulas);
    }
  };

  // Check if we're on the last step
  const isLastStep = currentStep === availableSteps[availableSteps.length - 1]?.id;
  const isFirstStep = currentStep === availableSteps[0]?.id;

  return (
    <FormProvider {...form}>
      <ThemedScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Step Indicator */}
          <FormSteps steps={availableSteps} currentStep={currentStep} />

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <View>
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Preencha os dados principais da tinta</CardDescription>
                </CardHeader>
                <CardContent style={styles.cardContent}>
                  {/* Name */}
                  <Controller
                control={form.control}
                name="name"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Nome da Tinta *</Label>
                    <Input
                      value={value}
                      onChangeText={onChange}
                      placeholder="Ex: Vermelho Ferrari"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Code */}
              <Controller
                control={form.control}
                name="code"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Código</Label>
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      placeholder="Ex: VW-123"
                      disabled={isSubmitting}
                      maxLength={20}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Hex Color */}
              <Controller
                control={form.control}
                name="hex"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Cor Hexadecimal *</Label>
                    <View style={styles.hexRow}>
                      <View style={styles.hexInputContainer}>
                        <Input
                          value={value}
                          onChangeText={onChange}
                          placeholder="#FF0000"
                          disabled={isSubmitting}
                          autoCapitalize="characters"
                        />
                      </View>
                      {value && (
                        <View style={[styles.colorPreview, { backgroundColor: value }]} />
                      )}
                    </View>
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Finish */}
              <Controller
                control={form.control}
                name="finish"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Acabamento *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={FINISH_OPTIONS}
                      placeholder="Selecione o acabamento"
                      disabled={isSubmitting}
                      searchable={false}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Classification */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Paint Type */}
              <Controller
                control={form.control}
                name="paintTypeId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Tipo de Tinta *</Label>
                    <Combobox
                      value={value}
                      onValueChange={onChange}
                      options={paintTypeOptions}
                      placeholder="Selecione o tipo"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado"
                      onSearchChange={setPaintTypeSearch}
                      disabled={isSubmitting || isLoadingTypes}
                      loading={isLoadingTypes}
                      clearable={false}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Paint Brand */}
              <Controller
                control={form.control}
                name="paintBrandId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Marca da Tinta</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={paintBrandOptions}
                      placeholder="Selecione a marca"
                      searchPlaceholder="Buscar marca..."
                      emptyText="Nenhuma marca encontrada"
                      onSearchChange={setPaintBrandSearch}
                      disabled={isSubmitting || isLoadingBrands}
                      loading={isLoadingBrands}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Manufacturer */}
              <Controller
                control={form.control}
                name="manufacturer"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Montadora</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || null)}
                      options={MANUFACTURER_OPTIONS}
                      placeholder="Selecione a montadora"
                      searchPlaceholder="Buscar montadora..."
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Paleta de Cores</CardTitle>
            </CardHeader>
            <CardContent style={styles.cardContent}>
              {/* Palette */}
              <Controller
                control={form.control}
                name="palette"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Paleta</Label>
                    <Combobox
                      value={value || ""}
                      onValueChange={(val) => onChange(val || undefined)}
                      options={PALETTE_OPTIONS}
                      placeholder="Selecione a paleta"
                      searchPlaceholder="Buscar paleta..."
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />

              {/* Palette Order */}
              <Controller
                control={form.control}
                name="paletteOrder"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Ordem na Paleta (1-14)</Label>
                    <Input
                      value={value?.toString() || ""}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        onChange(isNaN(num) ? undefined : num);
                      }}
                      placeholder="Ex: 1"
                      keyboardType="numeric"
                      disabled={isSubmitting}
                    />
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="tags"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Label>Tags da Tinta</Label>
                    <Input
                      value={Array.isArray(value) ? value.join(', ') : ''}
                      onChangeText={(text) => {
                        const tags = text.split(',').map(t => t.trim()).filter(t => t.length > 0)
                        onChange(tags)
                      }}
                      placeholder="Ex: metalizado, premium, importada"
                      disabled={isSubmitting}
                      multiline
                    />
                    <ThemedText style={styles.helperText}>
                      Separe as tags com vírgula
                    </ThemedText>
                    {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                  </View>
                )}
              />
            </CardContent>
          </Card>
            </View>
          )}

          {/* Step 2: Formula Management */}
          {currentStep === 2 && (
            <View>
              {/* Show existing formulas in update mode */}
              {props.mode === "update" && props.existingFormulas && props.existingFormulas.length > 0 && (
                <Card style={styles.card}>
                  <CardHeader>
                    <CardTitle>Fórmulas Existentes</CardTitle>
                    <CardDescription>Estas são as fórmulas já cadastradas para esta tinta</CardDescription>
                  </CardHeader>
                  <CardContent style={{ maxHeight: 400 }}>
                    <View style={{ gap: spacing.md }}>
                      {props.existingFormulas.map((formula, index) => (
                        <View key={formula.id} style={styles.existingFormulaCard}>
                          <ThemedText style={styles.existingFormulaTitle}>
                            {formula.description || `Fórmula ${index + 1}`}
                          </ThemedText>
                          {formula.components && formula.components.length > 0 && (
                            <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                              {formula.components.map((component) => (
                                <ThemedText key={component.id} style={styles.existingFormulaComponent}>
                                  • {component.item?.name || component.itemId}: {component.ratio.toFixed(2)}%
                                </ThemedText>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </CardContent>
                </Card>
              )}

              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>{mode === "update" ? "Adicionar Nova Fórmula" : "Formulação da Tinta"}</CardTitle>
                  <CardDescription>
                    {mode === "update" ? "Adicione uma nova fórmula para esta tinta (opcional)" : "Gerencie as fórmulas e componentes da tinta (opcional)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormulaManager
                    formulas={formulas}
                    onFormulasChange={setFormulas}
                    paintId={mode === "update" ? props.paintId : undefined}
                    availableItems={sortedComponentItems}
                  />
                </CardContent>
              </Card>
            </View>
          )}

          {/* Step 3: Ground Paints (conditional) */}
          {currentStep === 3 && paintType?.data?.needGround && (
            <View>
              <Card style={styles.card}>
                <CardHeader>
                  <CardTitle>Seleção de Fundo</CardTitle>
                  <CardDescription>Selecione os fundos necessários para esta tinta</CardDescription>
                </CardHeader>
                <CardContent>
                  <Controller
                    control={form.control}
                    name="groundIds"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <View>
                        <Label>Selecionar Tintas de Fundo</Label>
                        <Combobox
                          mode="multiple"
                          options={groundPaintOptions}
                          selectedValues={Array.isArray(value) ? value : []}
                          onValueChange={onChange}
                          onCreate={() => {}}
                          onSearchChange={setGroundPaintSearch}
                          onEndReached={() => {}}
                          placeholder="Selecione as tintas de fundo"
                          selectedText="tintas selecionadas"
                          searchPlaceholder="Buscar tintas..."
                          disabled={isSubmitting || isLoadingPaints}
                        />
                        {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
                      </View>
                    )}
                  />
                </CardContent>
              </Card>
            </View>
          )}

          {/* Navigation Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.actions}>
              {/* Cancel / Back Button */}
              <Button
                variant="outline"
                onPress={isFirstStep ? onCancel : prevStep}
                disabled={isSubmitting}
                style={styles.cancelButton}
              >
                <ThemedText>{isFirstStep ? "Cancelar" : "Voltar"}</ThemedText>
              </Button>

              {/* Next / Submit Button */}
              {isLastStep ? (
                <Button
                  onPress={form.handleSubmit(handleSubmit)}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <IconLoader size={20} color={colors.primaryForeground} />
                      <ThemedText style={{ color: colors.primaryForeground }}>Salvando...</ThemedText>
                    </View>
                  ) : (
                    <ThemedText style={{ color: colors.primaryForeground }}>
                      {mode === "create" ? "Criar Tinta" : "Salvar Alterações"}
                    </ThemedText>
                  )}
                </Button>
              ) : (
                <Button
                  onPress={nextStep}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  <ThemedText style={{ color: colors.primaryForeground }}>Próximo</ThemedText>
                </Button>
              )}
            </View>
          </View>
        </View>
      </ThemedScrollView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardContent: {
    gap: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#ef4444",
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  hexInputContainer: {
    flex: 1,
  },
  colorPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    minWidth: 100,
  },
  submitButton: {
    minWidth: 120,
  },
  existingFormulaCard: {
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  existingFormulaTitle: {
    fontWeight: '500',
    fontSize: fontSize.sm,
  },
  existingFormulaComponent: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    paddingLeft: spacing.sm,
  },
});
