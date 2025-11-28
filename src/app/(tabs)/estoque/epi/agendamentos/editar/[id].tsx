import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { Text } from "@/components/ui/text";

import { SCHEDULE_FREQUENCY, ASSIGNMENT_TYPE } from "@/constants";
import { SCHEDULE_FREQUENCY_LABELS, ASSIGNMENT_TYPE_LABELS, PPE_TYPE_LABELS } from "@/constants/enum-labels";

export default function EditPPEScheduleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // TODO: Use actual hook when available
  // const { data: schedule, isLoading } = usePpeSchedule(id);

  const schedule = null;
  const isLoading = false;

  const form = useForm({
    defaultValues: schedule ? {
      name: schedule.name,
      frequency: schedule.frequency,
      frequencyCount: schedule.frequencyCount,
      assignmentType: schedule.assignmentType,
      ppeTypes: schedule.ppeTypes || [],
      isActive: schedule.isActive,
    } : {
      name: "",
      frequency: SCHEDULE_FREQUENCY.MONTHLY,
      frequencyCount: 1,
      assignmentType: ASSIGNMENT_TYPE.INDIVIDUAL,
      ppeTypes: [] as string[],
      isActive: true,
    },
  });

  const frequencyOptions: ComboboxOption[] = Object.entries(SCHEDULE_FREQUENCY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const assignmentTypeOptions: ComboboxOption[] = Object.entries(ASSIGNMENT_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const ppeTypeOptions: ComboboxOption[] = Object.entries(PPE_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const handleSubmit = async () => {
    try {
      if (!id) {
        Alert.alert("Erro", "ID de agendamento não encontrado");
        return;
      }
      // TODO: Implement API call
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao atualizar o agendamento");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Carregando agendamento...
        </Text>
      </View>
    );
  }

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
          {/* Basic Information */}
          <FormCard title="Informações Básicas" icon="IconCalendar">
            {/* Name */}
            <FormFieldGroup
              label="Nome do Agendamento"
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
                    placeholder="Digite o nome do agendamento"
                    editable={!isLoading}
                    error={!!form.formState.errors.name}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Status */}
            <FormFieldGroup label="Status">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          {/* Schedule Configuration */}
          <FormCard title="Configuração de Frequência" icon="IconClock">
            {/* Frequency */}
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
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione a frequência"
                    disabled={isLoading}
                    searchable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {/* Frequency Count */}
            <FormFieldGroup
              label="Quantidade"
              error={form.formState.errors.frequencyCount?.message}
            >
              <Controller
                control={form.control}
                name="frequencyCount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={String(value || "1")}
                    onChangeText={(text) => onChange(text ? String(parseInt(text)) : "1")}
                    onBlur={onBlur}
                    placeholder="1"
                    editable={!isLoading}
                    error={!!form.formState.errors.frequencyCount}
                    keyboardType="number-pad"
                  />
                )}
              />
            </FormFieldGroup>

            {/* Assignment Type */}
            <FormFieldGroup
              label="Tipo de Atribuição"
              required
              error={form.formState.errors.assignmentType?.message}
            >
              <Controller
                control={form.control}
                name="assignmentType"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={assignmentTypeOptions}
                    value={value || undefined}
                    onValueChange={onChange}
                    placeholder="Selecione o tipo"
                    disabled={isLoading}
                    searchable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          {/* PPE Items */}
          <FormCard title="Tipos de EPI" icon="IconShield">
            {/* PPE Types */}
            <FormFieldGroup
              label="Selecione os tipos de EPI"
              error={form.formState.errors.ppeTypes?.message}
            >
              <Controller
                control={form.control}
                name="ppeTypes"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={ppeTypeOptions}
                    value={value?.[0] || undefined}
                    onValueChange={(val) => onChange(val ? [val] : [])}
                    placeholder="Selecione os tipos"
                    disabled={isLoading}
                    searchable={false}
                    clearable
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>

          <View style={styles.spacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      <SimpleFormActionBar
        onSave={form.handleSubmit(handleSubmit)}
        onCancel={handleCancel}
        isLoading={isLoading}
        isSaveDisabled={!form.formState.isDirty || isLoading}
      />
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
    padding: formSpacing.screenPadding,
    paddingBottom: formSpacing.screenPaddingBottom,
  },
  spacing: {
    height: spacing.xl,
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
});
