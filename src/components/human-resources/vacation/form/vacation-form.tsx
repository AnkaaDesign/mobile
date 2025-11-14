import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Combobox} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

import { vacationCreateSchema, vacationUpdateSchema } from "@/schemas/vacation";
import type { VacationCreateFormData, VacationUpdateFormData } from "@/schemas/vacation";
import type { Vacation } from "@/types";
import { useVacationMutations } from "@/hooks/useVacation";
import { useUsers } from "@/hooks/useUser";
import { VACATION_TYPE, VACATION_STATUS, USER_STATUS } from "@/constants";

interface VacationFormProps {
  mode: "create" | "update";
  vacation?: Vacation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VACATION_TYPE_LABELS = {
  [VACATION_TYPE.ANNUAL]: "Férias Anuais",
  [VACATION_TYPE.COLLECTIVE]: "Férias Coletivas",
  [VACATION_TYPE.SALE]: "Venda de Férias",
};

const VACATION_STATUS_LABELS = {
  [VACATION_STATUS.PENDING]: "Pendente",
  [VACATION_STATUS.APPROVED]: "Aprovado",
  [VACATION_STATUS.IN_PROGRESS]: "Em Andamento",
  [VACATION_STATUS.COMPLETED]: "Concluído",
  [VACATION_STATUS.REJECTED]: "Rejeitado",
  [VACATION_STATUS.CANCELLED]: "Cancelado",
};

export function VacationForm({ mode, vacation, onSuccess, onCancel }: VacationFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = useVacationMutations();

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
  });

  const form = useForm<VacationCreateFormData | VacationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? vacationCreateSchema : vacationUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            userId: null,
            startAt: new Date(),
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
            type: VACATION_TYPE.ANNUAL,
            status: VACATION_STATUS.PENDING,
            isCollective: false,
          }
        : {
            userId: vacation?.userId,
            startAt: vacation?.startAt,
            endAt: vacation?.endAt,
            type: vacation?.type,
            status: vacation?.status,
            isCollective: vacation?.isCollective,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isCollective = form.watch("isCollective");

  const handleSubmit = async (data: VacationCreateFormData | VacationUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as VacationCreateFormData);
      } else if (vacation) {
        await updateAsync({
          id: vacation.id,
          data: data as VacationUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar as férias");
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
      label: user.name,
    })) || [];

  const typeOptions: ComboboxOption[] = Object.entries(VACATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions: ComboboxOption[] = Object.entries(VACATION_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informações das Férias</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Preencha as informações do período de férias
          </Text>
        </View>

        <View style={styles.cardContent}>
          {/* Collective Toggle */}
          <View style={styles.formField}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.foreground }]}>Férias Coletivas</Text>
                <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                  Férias aplicadas a todos os colaboradores
                </Text>
              </View>
              <Controller
                control={form.control}
                name="isCollective"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value || false} onValueChange={onChange} disabled={isLoading} />
                )}
              />
            </View>
          </View>

          {/* User Selection - Only if not collective */}
          {!isCollective && (
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
                      value={value || undefined}
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
          )}

          {/* Start Date */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Data de Início <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="startAt"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data de início"
                    disabled={isLoading}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* End Date */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Data de Término <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="endAt"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data de término"
                    disabled={isLoading}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    Deve ser posterior à data de início
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Type */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Tipo <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="type"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={typeOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o tipo"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>

          {/* Status */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Status <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="status"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
