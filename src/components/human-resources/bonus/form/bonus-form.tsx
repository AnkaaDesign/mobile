import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

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
            month: currentMonth === 1 ? 12 : currentMonth - 1, // Previous month
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

  // Generate year options (current year and 2 years back)
  const yearOptions: ComboboxOption[] = Array.from({ length: 3 }, (_, i) => {
    const year = currentYear - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Generate month options
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
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informações do Bônus</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Preencha as informações do bônus do colaborador
          </Text>
        </View>

        <View style={styles.cardContent}>
          {/* User Selection */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Colaborador <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={userOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o colaborador"
                    disabled={isLoading}
                    searchable
                    clearable={false}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>

          {/* Year and Month Row */}
          <View style={styles.row}>
            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Ano <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <Controller
                control={form.control}
                name="year"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Combobox
                      options={yearOptions}
                      value={value?.toString()}
                      onValueChange={(v) => onChange(parseInt(v))}
                      placeholder="Ano"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  </View>
                )}
              />
            </View>

            <View style={[styles.formField, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Mês <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <Controller
                control={form.control}
                name="month"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <View>
                    <Combobox
                      options={monthOptions}
                      value={value?.toString()}
                      onValueChange={(v) => onChange(parseInt(v))}
                      placeholder="Mês"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  </View>
                )}
              />
            </View>
          </View>

          <Text style={[styles.helpText, { color: colors.mutedForeground, marginTop: -spacing.md, marginBottom: spacing.md }]}>
            Não é possível criar bônus para períodos futuros ou mais antigos que 24 meses
          </Text>

          {/* Performance Level */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nível de Desempenho <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="performanceLevel"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={PERFORMANCE_LEVELS}
                    value={value?.toString()}
                    onValueChange={(v) => onChange(parseInt(v))}
                    placeholder="Selecione o nível"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    Nível de 0 a 5, onde 5 é o desempenho máximo
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Base Bonus */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Bônus Base <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="baseBonus"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    type="currency"
                    value={value}
                    onChange={onChange}
                    placeholder="R$ 0,00"
                    editable={!isLoading}
                    error={!!error}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    Valor base do bônus para o período
                  </Text>
                </View>
              )}
            />
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button variant="outline" onPress={handleCancel} disabled={isLoading} style={{ flex: 1 }}>
          <Text>Cancelar</Text>
        </Button>
        <Button
          onPress={form.handleSubmit(handleSubmit)}
          disabled={isLoading || !form.formState.isValid}
          style={{ flex: 1 }}
        >
          <Text>{isLoading ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
  },
  cardContent: {
    padding: spacing.lg,
  },
  formField: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
