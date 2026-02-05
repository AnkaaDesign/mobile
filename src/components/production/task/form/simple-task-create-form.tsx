import { useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { IconFileText, IconCopy } from "@tabler/icons-react-native";
import { CustomerSelector } from "./customer-selector";
import { TaskNameAutocomplete } from "./task-name-autocomplete";
import { PlateTagsInput } from "./plate-tags-input";
import { SerialNumberRangeInput } from "./serial-number-range-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { TASK_STATUS, TRUCK_CATEGORY, IMPLEMENT_TYPE, SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE } from "@/constants/enums";
import { TRUCK_CATEGORY_LABELS, IMPLEMENT_TYPE_LABELS } from "@/constants/enum-labels";
import { DEFAULT_TASK_SERVICE_ORDER, getServiceDescriptionsByType } from "@/constants/service-descriptions";

// Extended schema matching web task-create-form.tsx
const simpleTaskSchema = z.object({
  name: z.string().optional(), // Name is not required
  customerId: z.string().uuid().nullable().optional(),
  plates: z.array(z.string()).optional(), // Array of plates
  serialNumbers: z.array(z.number()).optional(), // Array of serial numbers
  forecastDate: z.date().nullable().optional(), // Forecast release date
  serviceOrderDescription: z.string().nullable().optional(), // Service order description
  category: z.string().optional(), // Truck category
  implementType: z.string().optional(), // Implement type
});

type SimpleTaskFormData = z.infer<typeof simpleTaskSchema>;

interface SimpleTaskCreateFormProps {
  onSubmit: (data: SimpleTaskFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function SimpleTaskCreateForm({ onSubmit, onCancel, isSubmitting = false }: SimpleTaskCreateFormProps) {
  const { colors } = useTheme();

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(
    () => ({
      onFieldLayout: handlers.handleFieldLayout,
      onFieldFocus: handlers.handleFieldFocus,
      onComboboxOpen: handlers.handleComboboxOpen,
      onComboboxClose: handlers.handleComboboxClose,
    }),
    [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]
  );

  const form = useForm<SimpleTaskFormData>({
    resolver: zodResolver(simpleTaskSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      customerId: null,
      plates: [],
      serialNumbers: [],
      forecastDate: null,
      serviceOrderDescription: DEFAULT_TASK_SERVICE_ORDER.description,
      category: "",
      implementType: IMPLEMENT_TYPE.REFRIGERATED,
    },
  });

  // Watch form values for task count calculation
  const plates = useWatch({ control: form.control, name: "plates" }) || [];
  const serialNumbers = useWatch({ control: form.control, name: "serialNumbers" }) || [];

  // Get service order description options
  const serviceOrderOptions = useMemo(() => {
    const descriptions = getServiceDescriptionsByType(SERVICE_ORDER_TYPE.COMMERCIAL);
    return descriptions.map((description) => ({
      value: description,
      label: description,
    }));
  }, []);

  // Truck category options
  const truckCategoryOptions = useMemo(() => [
    { value: "", label: "Nenhuma" },
    ...Object.values(TRUCK_CATEGORY).map((cat) => ({
      value: cat,
      label: TRUCK_CATEGORY_LABELS[cat],
    })),
  ], []);

  // Implement type options
  const implementTypeOptions = useMemo(() => [
    { value: "", label: "Nenhum" },
    ...Object.values(IMPLEMENT_TYPE).map((type) => ({
      value: type,
      label: IMPLEMENT_TYPE_LABELS[type],
    })),
  ], []);

  // Calculate expected task count based on combinations
  const calculateTaskCount = () => {
    const plateCount = plates.length || 1; // If no plates, still create 1 task
    const serialCount = serialNumbers.length || 1; // If no serial numbers, still create 1 task

    // If both are specified, create combination
    if (plates.length > 0 && serialNumbers.length > 0) {
      return plateCount * serialCount;
    }

    // If only one is specified
    return Math.max(plateCount, serialCount);
  };

  const expectedTaskCount = calculateTaskCount();

  const handleSubmit = useCallback(
    async (data: SimpleTaskFormData) => {
      try {
        // Build payload matching web format
        const payload: any = {
          status: TASK_STATUS.PREPARATION,
        };

        // Add name if provided
        if (data.name && data.name.trim().length > 0) {
          payload.name = data.name.trim();
        }

        // Add customer if provided
        if (data.customerId) {
          payload.customerId = data.customerId;
        }

        // Add forecast date if provided
        if (data.forecastDate) {
          payload.forecastDate = data.forecastDate;
        }

        // Add service order if description is provided and has at least 3 chars
        if (data.serviceOrderDescription && data.serviceOrderDescription.trim().length >= 3) {
          payload.serviceOrders = [{
            status: SERVICE_ORDER_STATUS.PENDING,
            statusOrder: 1,
            description: data.serviceOrderDescription.trim(),
            type: SERVICE_ORDER_TYPE.COMMERCIAL,
            assignedToId: null,
          }];
        }

        // Add plates array if provided
        if (data.plates && data.plates.length > 0) {
          payload.plates = data.plates;
        }

        // Add serial numbers array if provided
        if (data.serialNumbers && data.serialNumbers.length > 0) {
          payload.serialNumbers = data.serialNumbers;
        }

        // Add truck category if provided
        if (data.category) {
          payload.category = data.category;
        }

        // Add implement type if provided
        if (data.implementType) {
          payload.implementType = data.implementType;
        }

        await onSubmit(payload);
      } catch (error) {
        console.error("Error submitting task:", error);
      }
    },
    [onSubmit]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={refs.scrollViewRef as React.RefObject<ScrollView>}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            <Card style={styles.card}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconFileText size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Informações da Tarefa</ThemedText>
                </View>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Task Name with Autocomplete - Not Required */}
                <TaskNameAutocomplete control={form.control} disabled={isSubmitting} />

                {/* Customer */}
                <FormFieldGroup label="Cliente" error={form.formState.errors.customerId?.message}>
                  <Controller
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <CustomerSelector
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Forecast Date */}
                <FormFieldGroup
                  label="Data de Previsão de Liberação"
                  error={form.formState.errors.forecastDate?.message}
                >
                  <Controller
                    control={form.control}
                    name="forecastDate"
                    render={({ field }) => (
                      <DatePicker
                        value={field.value || undefined}
                        onChange={field.onChange}
                        type="date"
                        placeholder="Selecione a data"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Service Order Description */}
                <FormFieldGroup
                  label="Ordem de Serviço"
                  error={form.formState.errors.serviceOrderDescription?.message}
                >
                  <Controller
                    control={form.control}
                    name="serviceOrderDescription"
                    render={({ field }) => (
                      <Combobox
                        value={field.value || ""}
                        onValueChange={(val) => field.onChange(val)}
                        options={serviceOrderOptions}
                        placeholder="Ex: Enviar Orçamento"
                        searchPlaceholder="Pesquisar serviços..."
                        emptyText="Nenhum serviço encontrado"
                        disabled={isSubmitting}
                        searchable={true}
                        clearable={true}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Truck Category and Implement Type - Side by Side */}
                <View style={styles.rowFields}>
                  {/* Truck Category */}
                  <View style={styles.halfField}>
                    <FormFieldGroup
                      label="Categoria"
                      error={form.formState.errors.category?.message}
                    >
                      <Controller
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <Combobox
                            value={field.value || ""}
                            onValueChange={(val) => field.onChange(val)}
                            options={truckCategoryOptions}
                            placeholder="Selecione"
                            searchPlaceholder="Buscar..."
                            emptyText="Nenhum encontrado"
                            disabled={isSubmitting}
                            searchable={false}
                            clearable={true}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  </View>

                  {/* Implement Type */}
                  <View style={styles.halfField}>
                    <FormFieldGroup
                      label="Implemento"
                      error={form.formState.errors.implementType?.message}
                    >
                      <Controller
                        control={form.control}
                        name="implementType"
                        render={({ field }) => (
                          <Combobox
                            value={field.value || ""}
                            onValueChange={(val) => field.onChange(val)}
                            options={implementTypeOptions}
                            placeholder="Selecione"
                            searchPlaceholder="Buscar..."
                            emptyText="Nenhum encontrado"
                            disabled={isSubmitting}
                            searchable={false}
                            clearable={true}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  </View>
                </View>

                {/* Plates - Badge Input (Full Width) */}
                <PlateTagsInput control={form.control} disabled={isSubmitting || serialNumbers.length > 1} />

                {/* Serial Numbers - Badge Input (Full Width) */}
                <SerialNumberRangeInput control={form.control} disabled={isSubmitting || plates.length > 1} />

                {/* Task Count Preview - only show when combining plates and serial numbers */}
                {plates.length > 0 && serialNumbers.length > 0 && expectedTaskCount > 1 && (
                  <View style={[styles.taskCountPreview, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
                    <IconCopy size={16} color={colors.primary} />
                    <View style={styles.taskCountTextContainer}>
                      <ThemedText style={[styles.taskCountPreviewText, { color: colors.primary }]}>
                        {expectedTaskCount} tarefas serão criadas
                      </ThemedText>
                      <ThemedText style={[styles.taskCountSubtext, { color: colors.primary }]}>
                        {plates.length} {plates.length === 1 ? 'placa' : 'placas'} × {serialNumbers.length} {serialNumbers.length === 1 ? 'número de série' : 'números de série'}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={onCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={form.formState.isValid}
          submitLabel={expectedTaskCount > 1 ? `Criar ${expectedTaskCount} Tarefa${expectedTaskCount > 1 ? "s" : ""}` : "Criar Tarefa"}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  card: {
    padding: 16, // spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16, // spacing.md
    paddingBottom: 8, // spacing.sm
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // spacing.sm
  },
  sectionTitle: {
    fontSize: 16, // fontSize.base
    fontWeight: "600" as any, // fontWeight.semibold
  },
  content: {
    gap: 16, // spacing.md
  },
  rowFields: {
    flexDirection: "row",
    gap: 12, // spacing.md
  },
  halfField: {
    flex: 1,
  },
  taskCountPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12, // spacing.md
    padding: 12, // spacing.md
    borderRadius: 8, // borderRadius.md
    borderWidth: 1,
  },
  taskCountTextContainer: {
    flex: 1,
  },
  taskCountPreviewText: {
    fontSize: 14, // fontSize.sm
    fontWeight: "600" as any, // fontWeight.semibold
  },
  taskCountSubtext: {
    fontSize: 12, // fontSize.xs
    marginTop: 2,
    opacity: 0.8,
  },
});
