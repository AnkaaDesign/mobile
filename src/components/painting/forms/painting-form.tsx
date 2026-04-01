import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useForm, Controller, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

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
import { usePaintTypes, usePaintBrands, usePaintType, useAvailableComponents, useKeyboardAwareScroll } from "@/hooks";
import { PAINT_FINISH, TRUCK_MANUFACTURER } from "@/constants";
import type { PaintFormula, Paint } from "../../../types";
import { FormulaManager } from "../formula/formula-manager";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { TagManager } from "@/components/administration/customer/form/tag-manager";
import { getPaints } from "@/api-client";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { PaintFinishPreview } from "@/components/painting/effects/paint-finish-preview";
import { IconFlask, IconX } from "@tabler/icons-react-native";

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

// Paint finish labels
const PAINT_FINISH_LABELS: Record<string, string> = {
  SOLID: "Lisa",
  METALLIC: "Metálico",
  PEARL: "Perolizado",
  MATTE: "Fosco",
  SATIN: "Semi Brilho",
};

// All possible steps
const ALL_STEPS: FormStep[] = [
  { id: 1, name: "Informações", description: "Dados e cor da tinta" },
  { id: 2, name: "Formulação", description: "Componentes e fórmulas (opcional)" },
  { id: 3, name: "Fundo da Tinta", description: "Selecione os fundos necessários" },
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

const PAINT_SELECT_FIELDS = {
  id: true,
  name: true,
  code: true,
  hex: true,

  finish: true,
  colorPreview: true,
  manufacturer: true,
  paintType: {
    select: {
      id: true,
      name: true,
    },
  },
  paintBrand: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      formulas: true,
    },
  },
};

// Paint color preview component for ground selector
function PaintColorPreview({ paint, size = 24 }: { paint: Paint; size?: number }) {
  const { colors } = useTheme();
  const hexColor = paint.hex || "#888888";

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border
    }}>
      {paint.colorPreview ? (
        <PaintPreview
          paint={paint}
          baseColor={hexColor}
          width={size}
          height={size}
          borderRadius={0}
        />
      ) : paint.finish ? (
        <PaintFinishPreview
          baseColor={hexColor}
          finish={paint.finish as PAINT_FINISH}
          width={size}
          height={size}
          disableAnimations={true}
          style={{ borderRadius: 0 }}
        />
      ) : (
        <View style={{ width: size, height: size, backgroundColor: hexColor }} />
      )}
    </View>
  );
}

export function PaintForm(props: PaintFormProps) {
  const { defaultValues, mode, onStepChange, onPaintTypeChange, isSubmitting, onCancel } = props;
  const { colors } = useTheme();

  // Keyboard-aware scrolling
  const { handlers, refs, getContentPadding } = useKeyboardAwareScroll();

  // Step management
  const [currentStep, setCurrentStep] = useState(props.currentStep || 1);
  const [formulas, setFormulas] = useState<PaintFormula[]>([]);

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
  const createDefaults = {
    name: "",
    hex: "#000000",
    finish: "SOLID",
    paintBrandId: "",
    manufacturer: null,
    tags: [],
    paintTypeId: "",
    groundIds: [],
    ...defaultValues,
  } as PaintCreateFormData;

  const form = useForm<PaintCreateFormData | PaintUpdateFormData>({
    resolver: zodResolver(mode === "create" ? paintCreateSchema : paintUpdateSchema),
    defaultValues: mode === "create" ? createDefaults : defaultValues,
    mode: "onTouched",
  });

  // Fetch paint types
  const { data: paintTypes, isLoading: isLoadingTypes } = usePaintTypes({
    orderBy: { name: "asc" },
  });

  // Fetch paint brands
  const { data: paintBrands, isLoading: isLoadingBrands } = usePaintBrands({
    orderBy: { name: "asc" },
  });

  // Auto-default "Laca" for paint type and "Farben" for paint brand in create mode
  useEffect(() => {
    if (mode !== "create") return;
    const currentTypeId = form.getValues("paintTypeId");
    if (!currentTypeId && paintTypes?.data) {
      const laca = paintTypes.data.find((t) => t.name.toLowerCase() === "laca");
      if (laca) form.setValue("paintTypeId", laca.id);
    }
  }, [paintTypes?.data, mode, form]);

  useEffect(() => {
    if (mode !== "create") return;
    const currentBrandId = form.getValues("paintBrandId");
    if (!currentBrandId && paintBrands?.data) {
      const farben = paintBrands.data.find((b) => b.name.toLowerCase() === "farben");
      if (farben) form.setValue("paintBrandId", farben.id);
    }
  }, [paintBrands?.data, mode, form]);

  // Watch paint type and paint brand selection
  const paintTypeId = form.watch("paintTypeId");
  const paintBrandId = form.watch("paintBrandId");

  // Get paint type details for ground requirements
  const { data: paintType } = usePaintType(paintTypeId || "", {
    enabled: !!paintTypeId,
  });

  // Whether this paint type needs ground
  const needsGround = paintType?.data?.needGround === true;

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

  // Dynamic steps: show ground step only when paint type needs it
  const availableSteps = useMemo(() => {
    if (needsGround) {
      return ALL_STEPS; // 3 steps: Info, Formula, Ground
    }
    return ALL_STEPS.slice(0, 2); // 2 steps: Info, Formula
  }, [needsGround]);

  // Step validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: {
        const step1Valid = await form.trigger(["name", "paintTypeId", "paintBrandId", "finish", "hex"]);
        if (!step1Valid) return false;

        const values = form.getValues();
        if (!values.name?.trim()) {
          form.setError("name", { type: "manual", message: "Nome da tinta não pode ser vazio" });
          return false;
        }
        return true;
      }

      case 2:
        // Formula step - always valid (optional)
        return true;

      case 3: {
        // Ground step - validate ground selection
        const groundValid = await form.trigger("groundIds");
        if (!groundValid) return false;

        const vals = form.getValues();
        if (!vals.groundIds || vals.groundIds.length === 0) {
          form.setError("groundIds", { type: "manual", message: "Selecione pelo menos um fundo" });
          return false;
        }
        return true;
      }

      default:
        return true;
    }
  }, [currentStep, form]);

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

  // Initial grounds for edit mode
  const initialGrounds = mode === "update" ? (props as UpdateFormProps).initialGrounds : undefined;

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
            contentContainerStyle={[styles.scrollContent, { paddingBottom: getContentPadding(spacing.lg) }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onLayout={handlers.handleScrollViewLayout}
            onScroll={handlers.handleScroll}
            scrollEventThrottle={16}
          >
            <KeyboardAwareFormProvider value={keyboardContextValue}>
              {/* Step Indicator */}
              <FormSteps steps={availableSteps} currentStep={currentStep} />

          {/* Step 1: Basic Information + Color */}
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
                  required
                  error={form.formState.errors.paintBrandId?.message}
                >
                  <Controller
                    control={form.control}
                    name="paintBrandId"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        value={value || ""}
                        onValueChange={(val) => onChange(val || "")}
                        options={paintBrandOptions}
                        placeholder="Selecione a marca"
                        searchPlaceholder="Buscar marca..."
                        emptyText="Nenhuma marca encontrada"
                        disabled={isSubmitting || isLoadingBrands}
                        loading={isLoadingBrands}
                        clearable={false}
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
                paintId={mode === "update" ? (props as UpdateFormProps).paintId : undefined}
                availableItems={sortedComponentItems}
              />
            </FormCard>
          )}

          {/* Step 3: Ground Paint Selection (only when paint type needs ground) */}
          {currentStep === 3 && needsGround && (
            <GroundPaintStep
              control={form.control}
              disabled={isSubmitting}
              initialGrounds={initialGrounds}
            />
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

// ─── Ground Paint Step (async combobox + custom paint chips) ────────────────

interface GroundPaintStepProps {
  control: any;
  disabled?: boolean;
  initialGrounds?: Paint[];
}

function GroundPaintStep({ control, disabled, initialGrounds }: GroundPaintStepProps) {
  const { colors } = useTheme();

  // Watch groundIds from form state
  const groundIds = useWatch({ control, name: "groundIds" }) as string[] | undefined;

  // Cache for paint objects
  const paintsCacheRef = useRef<Map<string, Paint>>(new Map());

  // Initialize cache from initialGrounds
  useEffect(() => {
    if (initialGrounds && initialGrounds.length > 0) {
      for (const paint of initialGrounds) {
        if (paint?.id) paintsCacheRef.current.set(paint.id, paint);
      }
    }
  }, [initialGrounds?.map(p => p.id).join(',')]);

  // Stable key for selected IDs
  const selectedIdsKey = useMemo(
    () => [...(groundIds || [])].sort().join(','),
    [groundIds]
  );

  // Fetch full paint objects for selected IDs
  const { data: fetchedPaintDetails } = useQuery({
    queryKey: ["paints", "ground-details", selectedIdsKey],
    queryFn: async () => {
      if (!groundIds || groundIds.length === 0) return [];
      const response = await getPaints({
        where: { id: { in: groundIds } },
        select: PAINT_SELECT_FIELDS,
        take: groundIds.length,
      } as any);
      return (response.data || []) as Paint[];
    },
    enabled: (groundIds?.length ?? 0) > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Update cache with fetched details
  useEffect(() => {
    if (fetchedPaintDetails && fetchedPaintDetails.length > 0) {
      for (const paint of fetchedPaintDetails) {
        if (paint?.id) paintsCacheRef.current.set(paint.id, paint);
      }
    }
  }, [fetchedPaintDetails]);

  // Memoize initialOptions
  const initialOptions = useMemo(() => initialGrounds || [], [initialGrounds?.map(p => p.id).join(',')]);

  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // Async search function
  const searchPaints = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{ data: Paint[]; hasMore: boolean }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 20,
      select: PAINT_SELECT_FIELDS,
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getPaints(params);
      const paints = (response.data || []).filter((paint: Paint) => paint && paint.id && paint.name);

      for (const paint of paints) {
        if (paint?.id) paintsCacheRef.current.set(paint.id, paint);
      }

      return {
        data: paints,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (err) {
      console.error('[GroundPaintStep] Error fetching paints:', err);
      return { data: [], hasMore: false };
    }
  }, []);

  // Custom render option for dropdown items
  const renderOption = useCallback(
    (option: any, isSelected: boolean) => {
      const paint = option as Paint;
      if (!paint) return null;

      return (
        <View style={groundStyles.optionContainer}>
          <PaintColorPreview paint={paint} size={24} />
          <View style={groundStyles.paintInfo}>
            <Text
              style={[
                groundStyles.paintName,
                { color: colors.foreground },
                isSelected && groundStyles.selectedText,
              ]}
              numberOfLines={1}
            >
              {paint.name}
            </Text>
            <View style={groundStyles.metadataContainer}>
              {paint.paintType?.name && (
                <Text style={[groundStyles.metadataText, { color: colors.mutedForeground }]}>
                  {paint.paintType.name}
                </Text>
              )}
              {paint.finish && (
                <>
                  {paint.paintType?.name && (
                    <Text style={[groundStyles.separator, { color: colors.mutedForeground }]}>{" \u2022 "}</Text>
                  )}
                  <Text style={[groundStyles.metadataText, { color: colors.mutedForeground }]}>
                    {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
                  </Text>
                </>
              )}
              {paint.paintBrand?.name && (
                <>
                  <Text style={[groundStyles.separator, { color: colors.mutedForeground }]}>{" \u2022 "}</Text>
                  <Text style={[groundStyles.metadataText, { color: colors.mutedForeground }]}>
                    {paint.paintBrand.name}
                  </Text>
                </>
              )}
            </View>
          </View>
          <IconFlask
            size={16}
            color={((paint._count?.formulas ?? 0) > 0 || (paint.formulas?.length ?? 0) > 0) ? "#16a34a" : colors.destructive}
          />
        </View>
      );
    },
    [colors]
  );

  // Build selected paints list from multiple sources
  const selectedPaintsList = useMemo(() => {
    const paintsMap = new Map<string, Paint>();

    // Priority 1: fetched details
    if (fetchedPaintDetails) {
      for (const paint of fetchedPaintDetails) {
        if (paint?.id) paintsMap.set(paint.id, paint);
      }
    }

    // Priority 2: cache
    for (const [id, paint] of paintsCacheRef.current) {
      if (!paintsMap.has(id)) paintsMap.set(id, paint);
    }

    // Priority 3: initialGrounds
    if (initialGrounds) {
      for (const paint of initialGrounds) {
        if (paint?.id && !paintsMap.has(paint.id)) paintsMap.set(paint.id, paint);
      }
    }

    return (groundIds || [])
      .map(id => paintsMap.get(id))
      .filter((p): p is Paint => !!p);
  }, [groundIds, fetchedPaintDetails, initialGrounds]);

  return (
    <FormCard title="Fundo da Tinta" icon="IconLayersIntersect">
      <FormFieldGroup
        label="Selecionar Tintas de Fundo"
        required
      >
        <Controller
          control={control}
          name="groundIds"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <Combobox<Paint>
                mode="multiple"
                value={Array.isArray(value) ? value : []}
                onValueChange={onChange}
                placeholder="Selecione as tintas de fundo"
                searchPlaceholder="Buscar tintas..."
                emptyText="Nenhuma tinta encontrada"
                disabled={disabled}
                error={error?.message}
                async={true}
                queryKey={["paints", "ground-search"]}
                queryFn={searchPaints}
                initialOptions={initialOptions}
                getOptionLabel={getOptionLabel}
                getOptionValue={getOptionValue}
                renderOption={renderOption}
                clearable={true}
                minSearchLength={0}
                pageSize={20}
                debounceMs={300}
                showCount={true}
                loadOnMount={false}
                hideDefaultBadges={true}
              />

              {/* Selected paint chips */}
              {selectedPaintsList.length > 0 && (
                <View style={groundStyles.chipsContainer}>
                  {selectedPaintsList.map((paint) => (
                    <Pressable
                      key={paint.id}
                      style={[groundStyles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                      onPress={disabled ? undefined : () => {
                        const currentValue = Array.isArray(value) ? value : [];
                        onChange(currentValue.filter((id: string) => id !== paint.id));
                      }}
                      disabled={disabled}
                    >
                      <PaintColorPreview paint={paint} size={16} />
                      <Text style={[groundStyles.chipName, { color: colors.foreground }]} numberOfLines={1}>
                        {paint.name}
                      </Text>
                      {paint.paintType?.name && (
                        <Text style={[groundStyles.chipType, { color: colors.mutedForeground }]}>
                          ({paint.paintType.name})
                        </Text>
                      )}
                      {paint.finish && (
                        <Text style={[groundStyles.chipFinish, { color: colors.mutedForeground }]}>
                          {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
                        </Text>
                      )}
                      {!disabled && (
                        <IconX size={12} color={colors.mutedForeground} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      </FormFieldGroup>
    </FormCard>
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

const groundStyles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  paintInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  paintName: {
    fontSize: 16,
    fontWeight: "500" as any,
  },
  selectedText: {
    fontWeight: "600" as any,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metadataText: {
    fontSize: 12,
  },
  separator: {
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipName: {
    fontSize: 12,
    fontWeight: "500" as any,
    maxWidth: 120,
  },
  chipType: {
    fontSize: 11,
    opacity: 0.7,
  },
  chipFinish: {
    fontSize: 11,
    opacity: 0.6,
  },
});
