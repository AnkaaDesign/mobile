import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

import { positionCreateSchema, positionUpdateSchema } from "@/schemas/position";
import type { PositionCreateFormData, PositionUpdateFormData } from "@/schemas/position";
import type { Position } from "@/types";
import { usePositionMutations } from "@/hooks/usePosition";

interface PositionFormProps {
  mode: "create" | "update";
  position?: Position;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PositionForm({ mode, position, onSuccess, onCancel }: PositionFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = usePositionMutations();

  const form = useForm<PositionCreateFormData | PositionUpdateFormData>({
    resolver: zodResolver(mode === "create" ? positionCreateSchema : positionUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            name: "",
            remuneration: 0,
            bonifiable: false,
            hierarchy: undefined,
          }
        : {
            name: position?.name,
            remuneration: undefined, // Optional for updates
            bonifiable: position?.bonifiable,
            hierarchy: position?.hierarchy ?? undefined,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: PositionCreateFormData | PositionUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as PositionCreateFormData);
      } else if (position) {
        await updateAsync({
          id: position.id,
          data: data as PositionUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o cargo");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informações do Cargo</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Preencha as informações básicas do cargo
          </Text>
        </View>

        <View style={styles.cardContent}>
          {/* Name Input */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Nome <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome do cargo"
                    editable={!isLoading}
                    error={!!error}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Remuneration Input */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Remuneração {mode === "create" && <Text style={{ color: colors.destructive }}>*</Text>}
            </Text>
            <Controller
              control={form.control}
              name="remuneration"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    type="currency"
                    value={value ?? undefined}
                    onChange={onChange}
                    placeholder="R$ 0,00"
                    editable={!isLoading}
                    error={!!error}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                  {mode === "update" && (
                    <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                      Deixe em branco para manter a remuneração atual. Ao atualizar, um novo registro será criado no histórico.
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Hierarchy Input */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>Hierarquia (opcional)</Text>
            <Controller
              control={form.control}
              name="hierarchy"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    type="integer"
                    value={value ?? undefined}
                    onChange={onChange}
                    placeholder="0"
                    min={0}
                    max={999}
                    editable={!isLoading}
                    error={!!error}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    Valor entre 0 e 999. Maior hierarquia = número maior.
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Bonifiable Toggle */}
          <View style={styles.formField}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.foreground }]}>Bonificável</Text>
                <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                  Cargo recebe bonificação por desempenho
                </Text>
              </View>
              <Controller
                control={form.control}
                name="bonifiable"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    value={value || false}
                    onValueChange={onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </View>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={isLoading}
          style={{ flex: 1 }}
        >
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
