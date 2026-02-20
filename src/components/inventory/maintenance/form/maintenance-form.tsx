import { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { maintenanceCreateSchema, maintenanceUpdateSchema } from "@/schemas/maintenance";
import type { MaintenanceCreateFormData, MaintenanceUpdateFormData } from "@/schemas/maintenance";
import type { FieldErrors } from "react-hook-form";
import type { Maintenance } from "@/types";
import { useMaintenanceMutations } from "@/hooks/useMaintenance";
import { useItems } from "@/hooks/useItem";
import { useKeyboardAwareScroll } from "@/hooks";
import { MAINTENANCE_STATUS } from "@/constants";
import { MAINTENANCE_STATUS_LABELS } from "@/constants/enum-labels";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes } from "@/constants";

interface MaintenanceFormProps {
  mode: "create" | "update";
  maintenance?: Maintenance;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MaintenanceForm({ mode, maintenance, onSuccess, onCancel }: MaintenanceFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useMaintenanceMutations();

  const { data: items } = useItems({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const form = useForm<MaintenanceCreateFormData | MaintenanceUpdateFormData>({
    resolver: zodResolver(mode === "create" ? maintenanceCreateSchema : maintenanceUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            name: "",
            description: "",
            status: MAINTENANCE_STATUS.PENDING,
            itemId: "",
            scheduledFor: new Date(),
            itemsNeeded: [],
          }
        : {
            name: maintenance?.name || "",
            description: maintenance?.description || "",
            status: maintenance?.status || MAINTENANCE_STATUS.PENDING,
            itemId: maintenance?.itemId || "",
            maintenanceScheduleId: maintenance?.maintenanceScheduleId || undefined,
            scheduledFor: maintenance?.scheduledFor ? new Date(maintenance.scheduledFor) : undefined,
            startedAt: maintenance?.startedAt ? new Date(maintenance.startedAt) : undefined,
            finishedAt: maintenance?.finishedAt ? new Date(maintenance.finishedAt) : undefined,
            timeTaken: maintenance?.timeTaken || undefined,
          },
  });

  // useFieldArray for maintenance items (only in create mode)
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itemsNeeded" as any,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const watchedStatus = form.watch("status");

  // Type-safe access to form errors for mode-specific fields
  const createErrors = form.formState.errors as FieldErrors<MaintenanceCreateFormData>;
  const updateErrors = form.formState.errors as FieldErrors<MaintenanceUpdateFormData>;

  const handleSubmit = async (data: MaintenanceCreateFormData | MaintenanceUpdateFormData) => {
    try {
      if (mode === "create") {
        const result = await createAsync(data as MaintenanceCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          router.replace(routeToMobilePath(routes.inventory.maintenance.details(newId)) as any);
        } else {
          router.back();
        }
      } else if (maintenance) {
        await updateAsync({
          id: maintenance.id,
          data: data as MaintenanceUpdateFormData,
        });
        onSuccess?.();
        router.replace(routeToMobilePath(routes.inventory.maintenance.details(maintenance.id)) as any);
      }
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar a manutenção");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: item.name,
    })) || [];

  const statusOptions: ComboboxOption[] = Object.entries(MAINTENANCE_STATUS_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  return (
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Basic Information */}
            <FormCard
              title="Informações da Manutenção"
              icon="IconTool"
            >
          {/* Name */}
          <FormFieldGroup
            label="Nome"
            required
            error={form.formState.errors.name?.message}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite o nome da manutenção"
                  editable={!isLoading}
                  error={!!form.formState.errors.name}
                />
              )}
            />
          </FormFieldGroup>

          {/* Description */}
          <FormFieldGroup
            label="Descrição"
            error={form.formState.errors.description?.message}
          >
            <Controller
              control={form.control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Descreva os detalhes da manutenção"
                  editable={!isLoading}
                  numberOfLines={3}
                />
              )}
            />
          </FormFieldGroup>

          {/* Item and Status Row */}
          <FormRow>
            <FormFieldGroup
              label="Item"
              required
              error={form.formState.errors.itemId?.message}
            >
              <Controller
                control={form.control}
                name="itemId"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={itemOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o item"
                    disabled={isLoading}
                    searchable
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Status"
              required
              error={form.formState.errors.status?.message}
            >
              <Controller
                control={form.control}
                name="status"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={statusOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o status"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>

        {/* Scheduling */}
        <FormCard
          title="Agendamento"
          icon="IconCalendar"
        >
          {/* Scheduled For */}
          <FormFieldGroup
            label="Data Agendada"
            required
            error={form.formState.errors.scheduledFor?.message}
          >
            <Controller
              control={form.control}
              name="scheduledFor"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="Selecione a data"
                  disabled={isLoading}
                  mode="datetime"
                />
              )}
            />
          </FormFieldGroup>

          {/* Only show in update mode and when status is IN_PROGRESS or COMPLETED */}
          {mode === "update" && (watchedStatus === MAINTENANCE_STATUS.IN_PROGRESS || watchedStatus === MAINTENANCE_STATUS.COMPLETED) && (
            <FormRow>
              <FormFieldGroup
                label="Data de Início"
                error={updateErrors.startedAt?.message}
              >
                <Controller
                  control={form.control}
                  name={"startedAt" as keyof MaintenanceUpdateFormData}
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      value={value instanceof Date ? value : undefined}
                      onChange={onChange}
                      placeholder="Selecione a data"
                      disabled={isLoading}
                      mode="datetime"
                    />
                  )}
                />
              </FormFieldGroup>

              {watchedStatus === MAINTENANCE_STATUS.COMPLETED && (
                <FormFieldGroup
                  label="Data de Conclusão"
                  error={updateErrors.finishedAt?.message}
                >
                  <Controller
                    control={form.control}
                    name={"finishedAt" as keyof MaintenanceUpdateFormData}
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value instanceof Date ? value : undefined}
                        onChange={onChange}
                        placeholder="Selecione a data"
                        disabled={isLoading}
                        mode="datetime"
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormRow>
          )}

          {/* Time Taken - only for completed */}
          {mode === "update" && watchedStatus === MAINTENANCE_STATUS.COMPLETED && (
            <FormFieldGroup
              label="Tempo Gasto (minutos)"
              error={updateErrors.timeTaken?.message}
            >
              <Controller
                control={form.control}
                name={"timeTaken" as keyof MaintenanceUpdateFormData}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={typeof value === "number" ? value.toString() : ""}
                    onChangeText={(val) => onChange(val ? Number(val) : null)}
                    onBlur={onBlur}
                    placeholder="Tempo em minutos"
                    keyboardType="numeric"
                    editable={!isLoading}
                    error={!!updateErrors.timeTaken}
                  />
                )}
              />
            </FormFieldGroup>
          )}
        </FormCard>

        {/* Items Needed (Only in create mode) */}
        {mode === "create" && (
          <FormCard
            title="Itens Necessários (Opcional)"
            icon="IconPackage"
          >
            {fields.map((field, index) => (
              <View key={field.id} style={styles.itemRow}>
                <View style={styles.itemFieldContainer}>
                  <FormFieldGroup
                    label={index === 0 ? "Item" : undefined}
                    error={createErrors.itemsNeeded?.[index]?.itemId?.message}
                  >
                    <Controller
                      control={form.control}
                      name={`itemsNeeded.${index}.itemId` as any}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Combobox
                          options={itemOptions}
                          value={value}
                          onValueChange={onChange}
                          placeholder="Selecione o item"
                          disabled={isLoading}
                          searchable
                          clearable={false}
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </View>

                <View style={styles.quantityContainer}>
                  <FormFieldGroup
                    label={index === 0 ? "Quantidade" : undefined}
                    error={createErrors.itemsNeeded?.[index]?.quantity?.message}
                  >
                    <Controller
                      control={form.control}
                      name={`itemsNeeded.${index}.quantity` as any}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          value={value?.toString() || "1"}
                          onChangeText={(val) => {
                            const numValue = parseInt(val);
                            onChange(isNaN(numValue) || numValue < 1 ? 1 : numValue);
                          }}
                          onBlur={onBlur}
                          placeholder="Qtd"
                          keyboardType="numeric"
                          editable={!isLoading}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </View>

                <View style={styles.removeButtonContainer}>
                  {index === 0 && <Text style={styles.removeButtonSpacer}>&nbsp;</Text>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => remove(index)}
                    disabled={isLoading}
                  >
                    <Text>Remover</Text>
                  </Button>
                </View>
              </View>
            ))}

            <Button
              variant="outline"
              size="sm"
              onPress={() => append({ itemId: "", quantity: 1 })}
              disabled={isLoading}
              style={styles.addButton}
            >
              <Text>Adicionar Item</Text>
            </Button>
          </FormCard>
            )}
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel={mode === "create" ? "Cadastrar" : "Atualizar"}
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
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  itemFieldContainer: {
    flex: 2,
  },
  quantityContainer: {
    flex: 1,
  },
  removeButtonContainer: {
    justifyContent: "flex-end",
  },
  removeButtonSpacer: {
    height: 20,
  },
  addButton: {
    marginTop: spacing.sm,
  },
});
