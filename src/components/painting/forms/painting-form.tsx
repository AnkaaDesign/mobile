import { useState, useCallback, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { FormSteps, type FormStep } from "@/components/ui/form-steps";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { paintCreateSchema, paintUpdateSchema, type PaintCreateFormData, type PaintUpdateFormData } from '../../../schemas';
import { usePaintTypes, usePaintBrands, usePaints, usePaintType, useAvailableComponents } from "@/hooks";
import { PAINT_FINISH, COLOR_PALETTE, TRUCK_MANUFACTURER } from "@/constants";
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

// Define steps
const steps: FormStep[] = [
  { id: 1, name: "Informações Básicas", description: "Dados principais da tinta" },
  { id: 2, name: "Preview", description: "Gerar imagem de visualização (opcional)" },
  { id: 3, name: "Formulação", description: "Componentes e fórmulas (opcional)" },
  { id: 4, name: "Fundo da Tinta", description: "Selecione os fundos necessários" },
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

  // Step management
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
    mode: "onTouched",
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

  // Watch paint type and paint brand selection
  const paintTypeId = form.watch("paintTypeId");
  const paintBrandId = form.watch("paintBrandId");

  // Get paint type details for ground requirements
  const { data: paintType } = usePaintType(paintTypeId || "", {
    enabled: !!paintTypeId,
  });

  // Get component items filtered by intersection of paint brand and paint type
  const { data: availableComponentsResponse } = useAvailableComponents({
    paintBrandId: paintBrandId || undefined,
    paintTypeId: paintTypeId || undefined,
    enabled: !!paintBrandId && !!paintTypeId,
  });

  // Notify parent when paint type changes
  useEffect(() => {
    if (paintTypeId && onPaintTypeChange) {
      onPaintTypeChange(paintTypeId);
    }
  }, [paintTypeId, onPaintTypeChange]);

  // Sort component items returned from the backend
  const sortedComponentItems = useMemo(() => {
    if (!availableComponentsResponse?.data) return [];

    return [...availableComponentsResponse.data].sort((a, b) => {
      const aUnicode = a.uniCode || "";
      const bUnicode = b.uniCode || "";

      if (aUnicode && bUnicode) {
        return aUnicode.localeCompare(bUnicode);
      }
      if (aUnicode && !bUnicode) return -1;
      if (!aUnicode && bUnicode) return 1;

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

  // Filter steps based on whether paint type needs ground
  const availableSteps = useMemo(() => {
    if (paintType?.data?.needGround) {
      return steps;
    }
    return steps.filter((step) => step.id !== 4);
  }, [paintType?.data?.needGround]);

  // Step validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        const step1Valid = await form.trigger(["name", "paintTypeId", "paintBrandId", "finish"]);
        if (!step1Valid) return false;

        const values = form.getValues();
        if (!values.name?.trim()) {
          form.setError("name", { type: "manual", message: "Nome da tinta não pode ser vazio" });
          return false;
        }
        return true;

      case 2:
        return await form.trigger(["hex"]);

      case 3:
        return true;

      case 4:
        if (paintType?.data?.needGround) {
          const groundValid = await form.trigger("groundIds");
          if (!groundValid) return false;

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

  // Navigation functions
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

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
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.ratio > 0));
      await (props as CreateFormProps).onSubmit(data as PaintCreateFormData, validFormulas);
    } else {
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.ratio > 0));
      await (props as UpdateFormProps).onSubmit(data as PaintUpdateFormData, validFormulas);
    }
  };

  const isLastStep = currentStep === availableSteps[availableSteps.length - 1]?.id;
  const isFirstStep = currentStep === availableSteps[0]?.id;

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <FormSteps steps={availableSteps} currentStep={currentStep} />

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <View>
              <FormCard title="Informações Básicas">
                {/* Name */}
                <FormFieldGroup
                  label="Nome da Tinta"
                  required
                  error={form.formState.errors.name?.message}
                >
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value}
                        onChangeText={onChange}
                        placeholder="Ex: Vermelho Ferrari"
                        editable={!isSubmitting}
                        error={!!form.formState.errors.name}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Code */}
                <FormFieldGroup
                  label="Código"
                  error={form.formState.errors.code?.message}
                >
                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        placeholder="Ex: VW-123"
                        editable={!isSubmitting}
                        maxLength={20}
                        error={!!form.formState.errors.code}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Finish */}
                <FormFieldGroup
                  label="Acabamento"
                  required
                  error={form.formState.errors.finish?.message}
                >
                  <Controller
                    control={form.control}
                    name="finish"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        value={value}
                        onValueChange={onChange}
                        options={FINISH_OPTIONS}
                        placeholder="Selecione o acabamento"
                        disabled={isSubmitting}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormCard>

              <FormCard title="Classificação">
                {/* Paint Type */}
                <FormFieldGroup
                  label="Tipo de Tinta"
                  required
                  error={form.formState.errors.paintTypeId?.message}
                >
                  <Controller
                    control={form.control}
                    name="paintTypeId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
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
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Paint Brand */}
                <FormFieldGroup
                  label="Marca da Tinta"
                  error={form.formState.errors.paintBrandId?.message}
                >
                  <Controller
                    control={form.control}
                    name="paintBrandId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
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
                        clearable
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Manufacturer */}
                <FormFieldGroup
                  label="Montadora"
                  error={form.formState.errors.manufacturer?.message}
                >
                  <Controller
                    control={form.control}
                    name="manufacturer"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => onChange(val || null)}
                        options={MANUFACTURER_OPTIONS}
                        placeholder="Selecione a montadora"
                        searchPlaceholder="Buscar montadora..."
                        disabled={isSubmitting}
                        clearable
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormCard>

              <FormCard title="Paleta de Cores">
                <FormRow>
                  {/* Palette */}
                  <FormFieldGroup
                    label="Paleta"
                    error={form.formState.errors.palette?.message}
                  >
                    <Controller
                      control={form.control}
                      name="palette"
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Combobox
                          value={value || ""}
                          onValueChange={(val) => onChange(val || undefined)}
                          options={PALETTE_OPTIONS}
                          placeholder="Selecione a paleta"
                          searchPlaceholder="Buscar paleta..."
                          disabled={isSubmitting}
                          clearable
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  {/* Palette Order */}
                  <FormFieldGroup
                    label="Ordem na Paleta"
                    helper="1-14"
                    error={form.formState.errors.paletteOrder?.message}
                  >
                    <Controller
                      control={form.control}
                      name="paletteOrder"
                      render={({ field: { onChange, value } }) => (
                        <Input
                          value={value?.toString() || ""}
                          onChangeText={(text) => {
                            const num = parseInt(text, 10);
                            onChange(isNaN(num) ? undefined : num);
                          }}
                          placeholder="Ex: 1"
                          keyboardType="numeric"
                          editable={!isSubmitting}
                          error={!!form.formState.errors.paletteOrder}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>
              </FormCard>

              <FormCard title="Tags">
                <FormFieldGroup
                  label="Tags da Tinta"
                  helper="Separe as tags com vírgula"
                  error={form.formState.errors.tags?.message}
                >
                  <Controller
                    control={form.control}
                    name="tags"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        value={Array.isArray(value) ? value.join(', ') : ''}
                        onChangeText={(text) => {
                          const tags = text.split(',').map(t => t.trim()).filter(t => t.length > 0)
                          onChange(tags)
                        }}
                        placeholder="Ex: metalizado, premium, importada"
                        editable={!isSubmitting}
                        multiline
                        error={!!form.formState.errors.tags}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormCard>
            </View>
          )}

          {/* Step 2: Color and Preview */}
          {currentStep === 2 && (
            <FormCard title="Cor Hexadecimal">
              <FormFieldGroup
                label="Cor Hexadecimal"
                required
                error={form.formState.errors.hex?.message}
              >
                <Controller
                  control={form.control}
                  name="hex"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.hexRow}>
                      <View style={styles.hexInputContainer}>
                        <Input
                          value={value}
                          onChangeText={onChange}
                          placeholder="#FF0000"
                          editable={!isSubmitting}
                          autoCapitalize="characters"
                          error={!!form.formState.errors.hex}
                        />
                      </View>
                      {value && (
                        <View style={[styles.colorPreview, { backgroundColor: value }]} />
                      )}
                    </View>
                  )}
                />
              </FormFieldGroup>

              {/* Color Preview */}
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.colorPreviewLarge,
                    { backgroundColor: form.watch("hex") || "#000000", borderColor: colors.border }
                  ]}
                />
              </View>
            </FormCard>
          )}

          {/* Step 3: Formula Management */}
          {currentStep === 3 && (
            <FormCard title={mode === "update" ? "Adicionar Nova Fórmula" : "Formulação da Tinta"}>
              <FormulaManager
                formulas={formulas}
                onFormulasChange={setFormulas}
                paintId={mode === "update" ? props.paintId : undefined}
                availableItems={sortedComponentItems}
              />
            </FormCard>
          )}

          {/* Step 4: Ground Paints */}
          {currentStep === 4 && paintType?.data?.needGround && (
            <FormCard title="Seleção de Fundo">
              <FormFieldGroup
                label="Selecionar Tintas de Fundo"
                required
                error={form.formState.errors.groundIds?.message}
              >
                <Controller
                  control={form.control}
                  name="groundIds"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
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
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>
          )}
        </ScrollView>

        {/* Action Bar */}
        <SimpleFormActionBar
          onCancel={isFirstStep ? onCancel : prevStep}
          onSubmit={isLastStep ? form.handleSubmit(handleSubmit) : nextStep}
          isSubmitting={isSubmitting}
          canSubmit={form.formState.isValid}
          cancelLabel={isFirstStep ? "Cancelar" : "Voltar"}
          submitLabel={isLastStep ? (mode === "create" ? "Criar Tinta" : "Salvar Alterações") : "Próximo"}
          showCancel={true}
        />
      </SafeAreaView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: spacing.xxl,
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
  previewContainer: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  colorPreviewLarge: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
  },
});
