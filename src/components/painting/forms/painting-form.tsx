import { useState, useCallback, useMemo, useEffect } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { FormSteps, type FormStep } from "@/components/ui/form-steps";
import { ColorPicker } from "@/components/ui/color-picker";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { paintCreateSchema, paintUpdateSchema, type PaintCreateFormData, type PaintUpdateFormData } from '../../../schemas';
import { usePaintTypes, usePaintBrands, usePaints, usePaintType, useAvailableComponents, useKeyboardAwareScroll } from "@/hooks";
import { PAINT_FINISH, TRUCK_MANUFACTURER } from "@/constants";
import type { PaintFormula, Paint } from "../../../types";
import { FormulaManager } from "../formula/formula-manager";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { TagManager } from "@/components/administration/customer/form/tag-manager";

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

// Define steps - simplified to 2 steps for mobile
const steps: FormStep[] = [
  { id: 1, name: "Informações", description: "Dados e cor da tinta" },
  { id: 2, name: "Formulação", description: "Componentes e fórmulas (opcional)" },
];

const FINISH_OPTIONS = [
  { value: PAINT_FINISH.SOLID, label: "Lisa" },
  { value: PAINT_FINISH.METALLIC, label: "Metálico" },
  { value: PAINT_FINISH.PEARL, label: "Perolizado" },
  { value: PAINT_FINISH.MATTE, label: "Fosco" },
  { value: PAINT_FINISH.SATIN, label: "Semi Brilho" },
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

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Step management
  const [currentStep, setCurrentStep] = useState(props.currentStep || 1);
  const [formulas, setFormulas] = useState<PaintFormula[]>([]);

  // Search states
  const [paintTypeSearch, setPaintTypeSearch] = useState("");
  const [paintBrandSearch, setPaintBrandSearch] = useState("");
  const [groundPaintSearch, setGroundPaintSearch] = useState("");

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

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

  // All steps are always available (simplified 2-step flow)
  const availableSteps = useMemo(() => steps, []);

  // Step validation - simplified for 2-step flow
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep) {
      case 1:
        // Validate basic info, hex color, and ground (if needed)
        const step1Valid = await form.trigger(["name", "paintTypeId", "paintBrandId", "finish", "hex"]);
        if (!step1Valid) return false;

        const values = form.getValues();
        if (!values.name?.trim()) {
          form.setError("name", { type: "manual", message: "Nome da tinta não pode ser vazio" });
          return false;
        }

        // Validate ground selection if paint type needs it
        if (paintType?.data?.needGround) {
          const groundValid = await form.trigger("groundIds");
          if (!groundValid) return false;

          if (!values.groundIds || values.groundIds.length === 0) {
            form.setError("groundIds", { type: "manual", message: "Selecione pelo menos um fundo" });
            return false;
          }
        }
        return true;

      case 2:
        // Formula step - always valid (optional)
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
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.weightInGrams && c.weightInGrams > 0));
      await (props as CreateFormProps).onSubmit(data as PaintCreateFormData, validFormulas);
    } else {
      const validFormulas = formulas.filter((f) => f.components && f.components.length > 0 && f.components.some((c) => c.itemId && c.weightInGrams && c.weightInGrams > 0));
      await (props as UpdateFormProps).onSubmit(data as PaintUpdateFormData, validFormulas);
    }
  };

  const isLastStep = currentStep === availableSteps[availableSteps.length - 1]?.id;
  const isFirstStep = currentStep === availableSteps[0]?.id;

  return (
    <FormProvider {...form}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            ref={refs.scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onLayout={handlers.handleScrollViewLayout}
            onScroll={handlers.handleScroll}
            scrollEventThrottle={16}
          >
            <KeyboardAwareFormProvider value={keyboardContextValue}>
              {/* Step Indicator */}
              <FormSteps steps={availableSteps} currentStep={currentStep} />

          {/* Step 1: Basic Information + Color + Ground */}
          {currentStep === 1 && (
            <View>
              <FormCard title="Informações Básicas" icon="IconPalette">
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

                {/* Color Picker */}
                <FormFieldGroup
                  label="Cor Base"
                  required
                  error={form.formState.errors.hex?.message}
                >
                  <Controller
                    control={form.control}
                    name="hex"
                    render={({ field: { onChange, value } }) => (
                      <ColorPicker
                        color={value || "#000000"}
                        onColorChange={onChange}
                        disabled={isSubmitting}
                        transparent
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

              {/* Ground Paints - shown conditionally */}
              {paintType?.data?.needGround && (
                <FormCard title="Seleção de Fundo" icon="IconDroplet">
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
                          value={Array.isArray(value) ? value : []}
                          onValueChange={onChange}
                          placeholder="Selecione as tintas de fundo"
                          searchPlaceholder="Buscar tintas..."
                          emptyText="Nenhuma tinta encontrada"
                          disabled={isSubmitting || isLoadingPaints}
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormCard>
              )}

              <FormCard title="Tags" icon="IconTags">
                <Controller
                  control={form.control}
                  name="tags"
                  render={({ field: { onChange, value } }) => (
                    <TagManager
                      tags={Array.isArray(value) ? value : []}
                      onChange={onChange}
                    />
                  )}
                />
              </FormCard>
            </View>
          )}

          {/* Step 2: Formula Management */}
          {currentStep === 2 && (
            <FormCard title={mode === "update" ? "Adicionar Nova Fórmula" : "Formulação da Tinta"} icon="IconFlask">
              <FormulaManager
                formulas={formulas}
                onFormulasChange={setFormulas}
                paintId={mode === "update" ? props.paintId : undefined}
                availableItems={sortedComponentItems}
              />
            </FormCard>
          )}
            </KeyboardAwareFormProvider>
          </ScrollView>

          {/* Action Bar */}
          <FormActionBar
            onCancel={isFirstStep ? onCancel : prevStep}
            onSubmit={isLastStep ? form.handleSubmit(handleSubmit) : nextStep}
            isSubmitting={isSubmitting}
            canSubmit={form.formState.isValid}
            cancelLabel={isFirstStep ? "Cancelar" : "Voltar"}
            submitLabel={isLastStep ? (mode === "create" ? "Cadastrar" : "Atualizar") : "Próximo"}
            showCancel={true}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
  },
});
