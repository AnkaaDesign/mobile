import React from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { notificationCreateSchema, notificationUpdateSchema } from "@/schemas/notification";
import type { NotificationCreateFormData, NotificationUpdateFormData } from "@/schemas/notification";
import type { Notification } from "@/types";
import { useNotificationMutations } from "@/hooks/useNotification";
import { useUsers } from "@/hooks/useUser";
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_CHANNEL,
  NOTIFICATION_IMPORTANCE,
  USER_STATUS,
} from "@/constants";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_IMPORTANCE_LABELS,
  NOTIFICATION_CHANNEL_LABELS,
} from "@/constants/enum-labels";

interface NotificationFormProps {
  mode: "create" | "update";
  notification?: Notification;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NotificationForm({ mode, notification, onSuccess, onCancel }: NotificationFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { createAsync, updateAsync, createMutation, updateMutation } = useNotificationMutations();

  const { data: users } = useUsers({
    where: { status: { not: USER_STATUS.DISMISSED } },
    orderBy: { name: "asc" },
  });

  const form = useForm<NotificationCreateFormData | NotificationUpdateFormData>({
    resolver: zodResolver(mode === "create" ? notificationCreateSchema : notificationUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            userId: null,
            title: "",
            body: "",
            type: NOTIFICATION_TYPE.GENERAL,
            channel: [NOTIFICATION_CHANNEL.IN_APP],
            importance: NOTIFICATION_IMPORTANCE.NORMAL,
            actionType: null,
            actionUrl: null,
            scheduledAt: null,
            sentAt: null,
          }
        : {
            userId: notification?.userId || null,
            title: notification?.title || "",
            body: notification?.body || "",
            type: notification?.type || NOTIFICATION_TYPE.GENERAL,
            channel: notification?.channel || [NOTIFICATION_CHANNEL.IN_APP],
            importance: notification?.importance || NOTIFICATION_IMPORTANCE.NORMAL,
            actionType: notification?.actionType || null,
            actionUrl: notification?.actionUrl || null,
            scheduledAt: notification?.scheduledAt ? new Date(notification.scheduledAt) : null,
            sentAt: notification?.sentAt ? new Date(notification.sentAt) : null,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: NotificationCreateFormData | NotificationUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as NotificationCreateFormData);
      } else if (notification) {
        await updateAsync({
          id: notification.id,
          data: data as NotificationUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar a notificação");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const userOptions: ComboboxOption[] = [
    { value: "", label: "Todos os usuários (broadcast)" },
    ...(users?.data?.map((user) => ({
      value: user.id,
      label: user.name,
    })) || []),
  ];

  const typeOptions: ComboboxOption[] = Object.entries(NOTIFICATION_TYPE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const importanceOptions: ComboboxOption[] = Object.entries(NOTIFICATION_IMPORTANCE_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const channelOptions: ComboboxOption[] = Object.entries(NOTIFICATION_CHANNEL_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView} keyboardVerticalOffset={0}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Main Form Card */}
        <FormCard
          title="Informações da Notificação"
          subtitle="Preencha os dados da notificação"
        >
          {/* Title */}
          <FormFieldGroup
            label="Título"
            required
            error={form.formState.errors.title?.message}
          >
            <Controller
              control={form.control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite o título da notificação"
                  editable={!isLoading}
                  error={!!form.formState.errors.title}
                />
              )}
            />
          </FormFieldGroup>

          {/* Body */}
          <FormFieldGroup
            label="Mensagem"
            required
            error={form.formState.errors.body?.message}
          >
            <Controller
              control={form.control}
              name="body"
              render={({ field: { onChange, onBlur, value } }) => (
                <Textarea
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Digite o conteúdo da notificação"
                  editable={!isLoading}
                  numberOfLines={4}
                />
              )}
            />
          </FormFieldGroup>

          {/* Type and Importance Row */}
          <FormRow>
            <FormFieldGroup
              label="Tipo"
              required
              error={form.formState.errors.type?.message}
            >
              <Controller
                control={form.control}
                name="type"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
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
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="Importância"
              required
              error={form.formState.errors.importance?.message}
            >
              <Controller
                control={form.control}
                name="importance"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={importanceOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione a importância"
                    disabled={isLoading}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>

          {/* User Selection */}
          <FormFieldGroup
            label="Destinatário"
            helper="Deixe vazio para enviar para todos os usuários"
            error={form.formState.errors.userId?.message}
          >
            <Controller
              control={form.control}
              name="userId"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Combobox
                  options={userOptions}
                  value={value || ""}
                  onValueChange={(val) => onChange(val === "" ? null : val)}
                  placeholder="Selecione o destinatário"
                  disabled={isLoading}
                  searchable
                  clearable
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Scheduling Card */}
        <FormCard
          title="Agendamento"
          subtitle="Configure quando a notificação será enviada"
        >
          <FormFieldGroup
            label="Agendar Para"
            helper="Deixe vazio para enviar imediatamente"
            error={form.formState.errors.scheduledAt?.message}
          >
            <Controller
              control={form.control}
              name="scheduledAt"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  value={value}
                  onChange={onChange}
                  placeholder="Selecione a data e hora"
                  disabled={isLoading}
                  mode="datetime"
                />
              )}
            />
          </FormFieldGroup>
        </FormCard>

        {/* Action Card (optional) */}
        <FormCard
          title="Ação"
          subtitle="Configure uma ação ao clicar na notificação (opcional)"
        >
          <FormRow>
            <FormFieldGroup
              label="Tipo de Ação"
              error={form.formState.errors.actionType?.message}
            >
              <Controller
                control={form.control}
                name="actionType"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={(val) => onChange(val || null)}
                    onBlur={onBlur}
                    placeholder="Ex: VIEW_DETAILS"
                    editable={!isLoading}
                    error={!!form.formState.errors.actionType}
                  />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup
              label="URL da Ação"
              error={form.formState.errors.actionUrl?.message}
            >
              <Controller
                control={form.control}
                name="actionUrl"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={value || ""}
                    onChangeText={(val) => onChange(val || null)}
                    onBlur={onBlur}
                    placeholder="https://..."
                    keyboardType="url"
                    autoCapitalize="none"
                    editable={!isLoading}
                    error={!!form.formState.errors.actionUrl}
                  />
                )}
              />
            </FormFieldGroup>
          </FormRow>
        </FormCard>
        </ScrollView>

        <SimpleFormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isValid}
          submitLabel={mode === "create" ? "Criar" : "Salvar"}
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
});
