import { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

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
  NOTIFICATION_ACTION_TYPE_LABELS,
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
  const { handlers, refs } = useKeyboardAwareScroll();
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

  const actionTypeOptions: ComboboxOption[] = [
    { value: "", label: "Nenhuma ação" },
    ...Object.entries(NOTIFICATION_ACTION_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Main Form Card */}
            <FormCard
              title="Informações da Notificação"
              icon="IconBell"
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

              {/* Channel Selection - Multiple Checkboxes */}
              <FormFieldGroup
                label="Canais de Notificação"
                required
                error={form.formState.errors.channel?.message}
                helper="Selecione pelo menos um canal para enviar a notificação"
              >
                <Controller
                  control={form.control}
                  name="channel"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.checkboxContainer}>
                      {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([channelValue, channelLabel]) => {
                        const isSelected = value?.includes(channelValue);
                        return (
                          <View key={channelValue} style={styles.checkboxRow}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(value || []), channelValue]
                                  : value?.filter((v) => v !== channelValue) || [];
                                onChange(updatedValue);
                              }}
                              disabled={isLoading}
                            />
                            <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
                              {channelLabel}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
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
              title="Configuração de Ação"
              subtitle="Configure uma ação ao clicar na notificação (opcional)"
            >
              <FormFieldGroup
                label="Tipo de Ação"
                error={form.formState.errors.actionType?.message}
              >
                <Controller
                  control={form.control}
                  name="actionType"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={actionTypeOptions}
                      value={value || ""}
                      onValueChange={(val) => onChange(val === "" ? null : val)}
                      placeholder="Selecione o tipo de ação"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup
                label="URL da Ação"
                required={form.watch("actionType") !== null && form.watch("actionType") !== ""}
                error={form.formState.errors.actionUrl?.message}
                helper={
                  form.watch("actionType") && !form.watch("actionUrl")
                    ? "URL é obrigatória quando um tipo de ação é selecionado"
                    : undefined
                }
              >
                <Controller
                  control={form.control}
                  name="actionUrl"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={(val) => onChange(val || null)}
                      onBlur={onBlur}
                      placeholder="https://exemplo.com/acao"
                      keyboardType="url"
                      autoCapitalize="none"
                      editable={!isLoading && (form.watch("actionType") !== null && form.watch("actionType") !== "")}
                      error={!!form.formState.errors.actionUrl}
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
  },
  checkboxContainer: {
    gap: spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
  },
});
