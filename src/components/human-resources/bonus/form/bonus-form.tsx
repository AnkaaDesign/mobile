import { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Text } from "@/components/ui/text";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing, fontSize } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { ThemedText } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

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

const PERFORMANCE_LEVELS = Array.from({ length: 6 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? "0 - Sem bonificação" : `${i}`,
}));

export function BonusForm({ mode, bonus, onSuccess, onCancel }: BonusFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
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
            month: currentMonth,
            userId: "",
            performanceLevel: 0,
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

  const yearOptions: ComboboxOption[] = Array.from({ length: 4 }, (_, i) => {
    const year = currentYear - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const monthOptions: ComboboxOption[] = [
    { value: "1", label: "1 - Janeiro" },
    { value: "2", label: "2 - Fevereiro" },
    { value: "3", label: "3 - Março" },
    { value: "4", label: "4 - Abril" },
    { value: "5", label: "5 - Maio" },
    { value: "6", label: "6 - Junho" },
    { value: "7", label: "7 - Julho" },
    { value: "8", label: "8 - Agosto" },
    { value: "9", label: "9 - Setembro" },
    { value: "10", label: "10 - Outubro" },
    { value: "11", label: "11 - Novembro" },
    { value: "12", label: "12 - Dezembro" },
  ];

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
          {/* Period Section */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="IconCalendar" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Período</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
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
                        onValueChange={(val) => onChange(parseInt(String(val), 10))}
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
                        onValueChange={(val) => onChange(parseInt(String(val), 10))}
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
            </View>
          </Card>

          {/* Employee Section */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="IconUser" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Funcionário</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <FormFieldGroup
                label="Funcionário"
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
                      placeholder="Selecione um funcionário"
                      searchPlaceholder="Buscar funcionário..."
                      disabled={isLoading}
                      searchable
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>
            </View>
          </Card>

          {/* Performance and Value Section */}
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="IconAward" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Bonificação</ThemedText>
              </View>
            </View>
            <View style={styles.content}>
              <FormRow>
                <FormFieldGroup
                  label="Nível de Performance"
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
                        onValueChange={(val) => onChange(parseInt(String(val), 10))}
                        placeholder="Selecione o nível"
                        disabled={isLoading}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup
                  label="Valor Base da Bonificação"
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
                        placeholder="0,00"
                        editable={!isLoading}
                        error={!!form.formState.errors.baseBonus}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>
            </View>
          </Card>

          {/* Period Display */}
          {form.watch("year") && form.watch("month") && (
            <View style={[styles.periodDisplay, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.periodLabel, { color: colors.foreground }]}>
                Período da Bonificação:
              </Text>
              <Text style={[styles.periodValue, { color: colors.mutedForeground }]}>
                26/{(form.watch("month") ?? 1) === 1 ? '12' : String((form.watch("month") ?? 1) - 1).padStart(2, '0')}/{(form.watch("month") ?? 1) === 1 ? (form.watch("year") ?? new Date().getFullYear()) - 1 : form.watch("year")} a 25/{String(form.watch("month") ?? 1).padStart(2, '0')}/{form.watch("year")}
              </Text>
            </View>
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
    gap: formSpacing.cardMarginBottom,
  },
  fieldGroup: {
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  periodDisplay: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  periodLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  periodValue: {
    fontSize: 14,
  },
});
