import { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";

import { useMaintenance } from "@/hooks/useMaintenance";
import { useItems } from "@/hooks/useItem";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

// Schedule form schema
const maintenanceScheduleUpdateSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  frequency: z.string().min(1, "Frequência é obrigatória"),
  frequencyCount: z.number().min(1, "Intervalo é obrigatório"),
  nextRun: z.date().optional(),
});

type MaintenanceScheduleUpdateFormData = z.infer<typeof maintenanceScheduleUpdateSchema>;

export default function MaintenanceScheduleEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: scheduleResponse, isLoading: scheduleLoading, error: scheduleError } = useMaintenance(id, {
    include: {
      item: true,
    },
  });
  const schedule = (scheduleResponse?.data || null) as any;

  const { data: items } = useItems({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const form = useForm<MaintenanceScheduleUpdateFormData>({
    resolver: zodResolver(maintenanceScheduleUpdateSchema),
    defaultValues: {
      itemId: schedule?.itemId || "",
      frequency: schedule?.frequency || "WEEKLY",
      frequencyCount: schedule?.frequencyCount || 1,
      nextRun: schedule?.nextRun ? new Date(schedule.nextRun) : undefined,
    },
  });

  const isLoading = scheduleLoading;

  const handleSubmit = async (_data: MaintenanceScheduleUpdateFormData) => {
    try {
      // TODO: Implement API call to update schedule
      Alert.alert("Sucesso", "Agendamento atualizado com sucesso");
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao atualizar o agendamento");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (scheduleLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando agendamento...
        </Text>
      </View>
    );
  }

  if (scheduleError || !schedule) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          Erro ao carregar agendamento
        </Text>
      </View>
    );
  }

  const itemOptions: ComboboxOption[] =
    items?.data?.map((item) => ({
      value: item.id,
      label: item.name,
    })) || [];

  const frequencyOptions: ComboboxOption[] = Object.entries(SCHEDULE_FREQUENCY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: () => {},
    onFieldFocus: () => {},
    onComboboxOpen: () => false,
    onComboboxClose: () => {},
  }), []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Schedule Information */}
            <FormCard
              title="Editar Agendamento"
              icon="IconTool"
            >
              {/* Item Selection */}
              <FormFieldGroup
                label="Item/Equipamento"
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

              {/* Frequency Selection */}
              <FormFieldGroup
                label="Frequência"
                required
                error={form.formState.errors.frequency?.message}
              >
                <Controller
                  control={form.control}
                  name="frequency"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={frequencyOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione a frequência"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Frequency Count */}
              <FormFieldGroup
                label="Intervalo"
                required
                error={form.formState.errors.frequencyCount?.message}
              >
                <Controller
                  control={form.control}
                  name="frequencyCount"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={String(value || 1)}
                      onChangeText={(val) => {
                        if (!val) {
                          onChange(1);
                          return;
                        }
                        const numValue = parseInt(String(val));
                        onChange(isNaN(numValue) || numValue < 1 ? 1 : numValue);
                      }}
                      onBlur={onBlur}
                      placeholder="Digite o intervalo"
                      keyboardType="numeric"
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Next Run Date */}
              <FormFieldGroup
                label="Próxima Execução"
                error={form.formState.errors.nextRun?.message}
              >
                <Controller
                  control={form.control}
                  name="nextRun"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker
                      value={value}
                      onChange={onChange}
                      placeholder="Selecione a data"
                      disabled={isLoading}
                      type="datetime"
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel="Atualizar Agendamento"
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
