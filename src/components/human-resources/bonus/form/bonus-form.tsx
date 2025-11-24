import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { bonusCreateSchema, bonusUpdateSchema } from "@/schemas/bonus";
import type { BonusCreateFormData, BonusUpdateFormData } from "@/schemas/bonus";
import type { Bonus } from "@/types";
import { useBonusMutations } from "@/hooks/bonus";
import { useUsers } from "@/hooks/useUser";
import { USER_STATUS } from "@/constants";

interface BonusFormProps {
  mode: "create" | "update";
  bonus?: Bonus;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PERFORMANCE_LEVELS = [
  { value: "0", label: "Nível 0" },
  { value: "1", label: "Nível 1" },
  { value: "2", label: "Nível 2" },
  { value: "3", label: "Nível 3" },
  { value: "4", label: "Nível 4" },
  { value: "5", label: "Nível 5" },
];

export function BonusForm({ mode, bonus, onSuccess, onCancel }: BonusFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = useBonusMutations();

  const { data: users } = useUsers({
    where: { status: USER_STATUS.EFFECTED },
    orderBy: { name: "asc" },
    include: { position: true },
  });

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const form = useForm<BonusCreateFormData | BonusUpdateFormData>({
    resolver: zodResolver(mode === "create" ? bonusCreateSchema : bonusUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            year: currentYear,
            month: currentMonth === 1 ? 12 : currentMonth - 1,
            userId: "",
            performanceLevel: 3,
            baseBonus: 0,
          }
        : {
            year: bonus?.year,
            month: bonus?.month,
            userId: bonus?.userId,
            performanceLevel: bonus?.performanceLevel,
            baseBonus: typeof bonus?.baseBonus === "number" ? bonus.baseBonus : undefined,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: BonusCreateFormData | BonusUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as BonusCreateFormData);
      } else if (bonus) {
        await updateAsync({
          id: bonus.id,
          data: data as BonusUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o bônus");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const userOptions: ComboboxOption[] =
    users?.data?.map((user) => ({
      value: user.id,
      label: user.name + (user.position ? ` - ${user.position.name}` : ""),
    })) || [];

  const yearOptions: ComboboxOption[] = Array.from({ length: 3 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  const monthOptions: ComboboxOption[] = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FormCard title="Informações do Bônus">
          {/* User Selection */}
          <FormFieldGroup
            label="Colaborador"
            required
            error={form.formState.errors.userId?.message}
          >
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={userOptions}
                  value={value}
                  onValueChange={onChange}
                  placeholder="Selecione o colaborador"
                  searchPlaceholder="Buscar colaborador..."
                  disabled={isLoading}
                  searchable
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Year and Month */}
          <FormRow>
            <FormFieldGroup
              label="Ano"
              required
              error={form.formState.errors.year?.message}
            >
              <Controller
                control={form.control}
                name="year"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={yearOptions}
                    value={value?.toString() || ""}
                    onValueChange={(val) => onChange(parseInt(val, 10))}
                    placeholder="Selecione o ano"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Mês"
              required
              error={form.formState.errors.month?.message}
            >
              <Controller
                control={form.control}
                name="month"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={monthOptions}
                    value={value?.toString() || ""}
                    onValueChange={(val) => onChange(parseInt(val, 10))}
                    placeholder="Selecione o mês"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* Performance Level */}
          <FormFieldGroup
            label="Nível de Desempenho"
            required
            error={form.formState.errors.performanceLevel?.message}
          >
            <Controller
              control={form.control}
              name="performanceLevel"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={PERFORMANCE_LEVELS}
                  value={value?.toString() || ""}
                  onValueChange={(val) => onChange(parseInt(val, 10))}
                  placeholder="Selecione o nível"
                  disabled={isLoading}
                  searchable={false}
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>

          {/* Base Bonus */}
          <FormFieldGroup
            label="Bônus Base"
            required
            error={form.formState.errors.baseBonus?.message}
          >
            <Controller
              control={form.control}
              name="baseBonus"
              render={({ field: { onChange, value } }) => (
                <Input
                  type="currency"
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="R$ 0,00"
                  editable={!isLoading}
                  error={!!form.formState.errors.baseBonus}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>
      </ScrollView>

      <SimpleFormActionBar
        onCancel={handleCancel}
        onSubmit={form.handleSubmit(handleSubmit)}
        isSubmitting={isLoading}
        canSubmit={form.formState.isValid}
        submitLabel={mode === "create" ? "Criar" : "Salvar"}
      />
    </SafeAreaView>
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
    paddingBottom: 0, // No spacing - action bar has its own margin
  },
});
