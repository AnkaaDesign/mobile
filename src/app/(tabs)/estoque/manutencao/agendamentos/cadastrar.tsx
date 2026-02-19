import { useMemo } from "react";
import { ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";

import { useItems } from "@/hooks/useItem";
import { SCHEDULE_FREQUENCY_LABELS } from "@/constants";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useScreenReady } from '@/hooks/use-screen-ready';

// Schedule form schema
const maintenanceScheduleCreateSchema = z.object({
  itemId: z.string().min(1, "Item é obrigatório"),
  frequency: z.string().min(1, "Frequência é obrigatória"),
  frequencyCount: z.number().min(1, "Intervalo é obrigatório"),
  nextRun: z.date().optional(),
});

type MaintenanceScheduleCreateFormData = z.infer<typeof maintenanceScheduleCreateSchema>;

interface MaintenanceScheduleCreateScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MaintenanceScheduleCreateScreen({
  onSuccess,
  onCancel,
}: MaintenanceScheduleCreateScreenProps) {
  useScreenReady();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: items } = useItems({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const form = useForm<MaintenanceScheduleCreateFormData>({
    resolver: zodResolver(maintenanceScheduleCreateSchema),
    defaultValues: {
      itemId: "",
      frequency: "WEEKLY",
      frequencyCount: 1,
      nextRun: new Date(),
    },
  });

  const isLoading = false;

  const handleSubmit = async (_data: MaintenanceScheduleCreateFormData) => {
    try {
      // TODO: Implement API call to create schedule
      Alert.alert("Sucesso", "Agendamento criado com sucesso");
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o agendamento");
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
              title="Novo Agendamento"
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
          submitLabel="Criar Agendamento"
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
});
