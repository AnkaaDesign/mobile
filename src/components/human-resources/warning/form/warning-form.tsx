import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Combobox} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import { FileUpload} from "@/components/ui/file-upload";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

import { warningCreateSchema, warningUpdateSchema } from "@/schemas/warning";
import type { WarningCreateFormData, WarningUpdateFormData } from "@/schemas/warning";
import type { Warning } from "@/types";
import { useWarningMutations } from "@/hooks/useWarning";
import { useUsers } from "@/hooks/useUser";
import { WARNING_SEVERITY, WARNING_CATEGORY, USER_STATUS } from "@/constants";

interface WarningFormProps {
  mode: "create" | "update";
  warning?: Warning;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SEVERITY_LABELS = {
  [WARNING_SEVERITY.LOW]: "Baixa",
  [WARNING_SEVERITY.MEDIUM]: "Média",
  [WARNING_SEVERITY.HIGH]: "Alta",
};

const CATEGORY_LABELS = {
  [WARNING_CATEGORY.ABSENCE]: "Ausência",
  [WARNING_CATEGORY.DELAY]: "Atraso",
  [WARNING_CATEGORY.BEHAVIOR]: "Comportamento",
  [WARNING_CATEGORY.SAFETY]: "Segurança",
  [WARNING_CATEGORY.QUALITY]: "Qualidade",
  [WARNING_CATEGORY.OTHER]: "Outro",
};

export function WarningForm({ mode, warning, onSuccess, onCancel }: WarningFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = useWarningMutations();
  const [files, setFiles] = useState<FileItem[]>([]);

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
    include: { position: true },
  });

  const form = useForm<WarningCreateFormData | WarningUpdateFormData>({
    resolver: zodResolver(mode === "create" ? warningCreateSchema : warningUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            severity: WARNING_SEVERITY.LOW,
            category: WARNING_CATEGORY.OTHER,
            reason: "",
            description: null,
            isActive: true,
            collaboratorId: "",
            supervisorId: "",
            witnessIds: [],
            attachmentIds: [],
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
            hrNotes: null,
            resolvedAt: null,
          }
        : {
            severity: warning?.severity,
            category: warning?.category,
            reason: warning?.reason,
            description: warning?.description,
            isActive: warning?.isActive,
            collaboratorId: warning?.collaboratorId,
            supervisorId: warning?.supervisorId,
            witnessIds: warning?.witness?.map((w) => w.id) || [],
            attachmentIds: warning?.attachments?.map((a) => a.id) || [],
            followUpDate: warning?.followUpDate,
            hrNotes: warning?.hrNotes,
            resolvedAt: warning?.resolvedAt,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: WarningCreateFormData | WarningUpdateFormData) => {
    try {
      // Note: File upload would need to be handled separately via file upload API
      // For now, we're just tracking the file objects

      if (mode === "create") {
        await createAsync(data as WarningCreateFormData);
      } else if (warning) {
        await updateAsync({
          id: warning.id,
          data: data as WarningUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar a advertência");
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

  const witnessOptions = userOptions.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const severityOptions: ComboboxOption[] = Object.entries(SEVERITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const categoryOptions: ComboboxOption[] = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <ScrollView style={styles.container}>
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Informações da Advertência</Text>
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
            Preencha os dados da advertência ao colaborador
          </Text>
        </View>

        <View style={styles.cardContent}>
          {/* Collaborator */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Colaborador <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="collaboratorId"
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

          {/* Severity */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Gravidade <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="severity"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={severityOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione a gravidade"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>

          {/* Category */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Categoria <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="category"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={categoryOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione a categoria"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>

          {/* Reason */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Motivo <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="reason"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Descreva o motivo da advertência"
                    editable={!isLoading}
                    error={!!error}
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                    multiline
                    numberOfLines={3}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    Mínimo 10 caracteres, máximo 500
                  </Text>
                </View>
              )}
            />
          </View>

          {/* Description (optional) */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>Descrição Detalhada (opcional)</Text>
            <Controller
              control={form.control}
              name="description"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Detalhes adicionais sobre a advertência"
                    editable={!isLoading}
                    error={!!error}
                    style={{ minHeight: 100, textAlignVertical: "top" }}
                    multiline
                    numberOfLines={4}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Supervisor */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Supervisor <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="supervisorId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    options={userOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o supervisor"
                    disabled={isLoading}
                    searchable
                    clearable={false}
                    error={error?.message}
                  />
                </View>
              )}
            />
          </View>

          {/* Witnesses (optional) */}
          <View style={styles.formField}>
            <Controller
              control={form.control}
              name="witnessIds"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <MultiSelect
                  label="Testemunhas (opcional)"
                  options={witnessOptions}
                  selectedValues={value || []}
                  onValuesChange={onChange}
                  placeholder="Selecione as testemunhas"
                  disabled={isLoading}
                  searchable
                  error={error?.message}
                />
              )}
            />
          </View>

          {/* Follow Up Date */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Data de Acompanhamento <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <Controller
              control={form.control}
              name="followUpDate"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <DatePicker
                    value={value}
                    onChange={onChange}
                    placeholder="Selecione a data de acompanhamento"
                    disabled={isLoading}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* File Attachments */}
          <View style={styles.formField}>
            <Controller
              control={form.control}
              name="attachmentIds"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <FileUpload
                  label="Anexos (opcional)"
                  value={files}
                  onChange={(newFiles) => {
                    setFiles(newFiles);
                    // In a real implementation, you'd upload files and get IDs
                    // For now, we're just tracking file count
                    onChange(newFiles.map((_, i) => `temp-${i}`));
                  }}
                  maxFiles={10}
                  accept="all"
                  disabled={isLoading}
                  error={error?.message}
                />
              )}
            />
            <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
              Máximo de 10 arquivos (imagens ou documentos)
            </Text>
          </View>

          {/* HR Notes (optional) */}
          <View style={styles.formField}>
            <Text style={[styles.label, { color: colors.foreground }]}>Observações RH (opcional)</Text>
            <Controller
              control={form.control}
              name="hrNotes"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <View>
                  <Input
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Observações internas do departamento de RH"
                    editable={!isLoading}
                    error={!!error}
                    style={{ minHeight: 80, textAlignVertical: "top" }}
                    multiline
                    numberOfLines={3}
                  />
                  {error && (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{error.message}</Text>
                  )}
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
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
