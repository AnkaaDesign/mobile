import { useMemo, useCallback, useState } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

import type { User, Sector } from "@/types";
import { getUsers, getSectors, adminSendNotification, type AdminSendNotificationData } from "@/api-client";
import { userKeys, sectorKeys } from "@/hooks/queryKeys";
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

// =====================
// Form Schema (matching web version)
// =====================

const notificationFormSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  body: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
  type: z.enum(["SYSTEM", "GENERAL", "WARNING"]),
  importance: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  channels: z.array(z.enum(["IN_APP", "EMAIL", "PUSH", "WHATSAPP"])).min(1, "Selecione pelo menos um canal"),
  actionUrl: z.string().optional(),
  scheduledAt: z.date().nullable().optional(),
  targetType: z.enum(["all", "sectors", "users"]),
  targetSectors: z.array(z.string()).optional(),
  targetUsers: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.targetType === "users") {
    return data.targetUsers && data.targetUsers.length > 0;
  }
  if (data.targetType === "sectors") {
    return data.targetSectors && data.targetSectors.length > 0;
  }
  return true;
}, {
  message: "Selecione pelo menos um destinatário",
  path: ["targetUsers"],
});

type NotificationFormData = z.infer<typeof notificationFormSchema>;

interface NotificationFormProps {
  mode: "create" | "update";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function NotificationForm({ mode, onSuccess, onCancel }: NotificationFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const [isSending, setIsSending] = useState(false);
  const [scheduleLater, setScheduleLater] = useState(false);

  // Async query function for paginated user fetching (matching web version)
  // Filter by isActive: true to only show active users for notifications
  const fetchUsers = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getUsers({
      searchingFor: searchTerm || undefined,
      where: { isActive: true },
      orderBy: { name: "asc" },
      page,
      limit: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      data: response.data?.map((user: User) => ({
        value: user.id,
        label: user.email ? `${user.name} (${user.email})` : user.name,
      })) || [],
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.total,
    };
  }, []);

  // Async query function for paginated sector fetching
  const fetchSectors = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getSectors({
      searchingFor: searchTerm || undefined,
      orderBy: { name: "asc" },
      page,
      limit: pageSize,
    });

    return {
      data: response.data?.map((sector: Sector) => ({
        value: sector.privileges || sector.id,
        label: sector.name,
      })) || [],
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.total,
    };
  }, []);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: "",
      body: "",
      type: "SYSTEM", // SYSTEM type is mandatory - users cannot hide these
      importance: "NORMAL",
      channels: ["IN_APP", "PUSH"], // In-app and push mobile enabled by default
      targetType: "users",
      targetSectors: [],
      targetUsers: [],
      actionUrl: "",
      scheduledAt: null,
    },
  });

  const handleSubmit = async (data: NotificationFormData) => {
    try {
      // Validate targeting requirements
      if (data.targetType === "users" && (!data.targetUsers || data.targetUsers.length === 0)) {
        Alert.alert("Erro", "Selecione pelo menos um usuário ao enviar para usuários específicos");
        return;
      }
      if (data.targetType === "sectors" && (!data.targetSectors || data.targetSectors.length === 0)) {
        Alert.alert("Erro", "Selecione pelo menos um setor ao enviar para setores específicos");
        return;
      }

      setIsSending(true);

      // Prepare payload based on target type (matching web version)
      const payload: AdminSendNotificationData = {
        title: data.title,
        body: data.body,
        type: data.type,
        importance: data.importance,
        channel: data.channels,
        actionUrl: data.actionUrl || undefined,
        scheduledAt: scheduleLater && data.scheduledAt ? data.scheduledAt.toISOString() : undefined,
      };

      // Add targeting based on selection
      if (data.targetType === "sectors" && data.targetSectors && data.targetSectors.length > 0) {
        payload.targetSectors = data.targetSectors;
      } else if (data.targetType === "users" && data.targetUsers && data.targetUsers.length > 0) {
        payload.targetUsers = data.targetUsers;
      }
      // If targetType is "all", send to all users (handled by backend)

      // Send notification via admin endpoint
      await adminSendNotification(payload);

      Alert.alert("Sucesso", scheduleLater ? "Notificação agendada com sucesso" : "Notificação enviada com sucesso");
      onSuccess?.();
      router.back();
    } catch (error: any) {
      console.error("Error sending notification:", error);
      Alert.alert("Erro", error?.message || "Erro ao enviar notificação");
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const selectedChannels = form.watch("channels") || [];
  const targetType = form.watch("targetType");
  const targetUsers = form.watch("targetUsers") || [];
  const targetSectors = form.watch("targetSectors") || [];

  // Check if form can be submitted based on targeting
  const canSubmit =
    targetType === "all" ||
    (targetType === "users" && targetUsers.length > 0) ||
    (targetType === "sectors" && targetSectors.length > 0);

  const typeOptions: ComboboxOption[] = [
    { value: "SYSTEM", label: "Sistema (Obrigatória)" },
    { value: "WARNING", label: "Aviso" },
    { value: "GENERAL", label: "Geral" },
  ];

  const importanceOptions: ComboboxOption[] = [
    { value: "LOW", label: "Baixa" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "Alta" },
    { value: "URGENT", label: "Urgente" },
  ];

  const targetTypeOptions: ComboboxOption[] = [
    { value: "all", label: "Todos os usuários" },
    { value: "sectors", label: "Setores específicos" },
    { value: "users", label: "Usuários específicos" },
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
            {/* Basic Information */}
            <FormCard
              title="Informações Básicas"
              subtitle="Defina o título e conteúdo da notificação"
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
                      placeholder="Ex: Atualização Importante do Sistema"
                      editable={!isSending}
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
                      placeholder="Digite a mensagem completa da notificação..."
                      editable={!isSending}
                      numberOfLines={5}
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
                        disabled={isSending}
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
                        disabled={isSending}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              {/* Action URL */}
              <FormFieldGroup
                label="URL de Ação (Opcional)"
                helper="URL para onde o usuário será direcionado ao clicar na notificação"
                error={form.formState.errors.actionUrl?.message}
              >
                <Controller
                  control={form.control}
                  name="actionUrl"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="/administracao/configuracoes"
                      keyboardType="url"
                      autoCapitalize="none"
                      editable={!isSending}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Delivery Channels */}
            <FormCard
              title="Canais de Entrega"
              subtitle="Selecione os canais para enviar a notificação"
            >
              <FormFieldGroup
                label="Canais"
                required
                error={form.formState.errors.channels?.message}
              >
                <Controller
                  control={form.control}
                  name="channels"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.checkboxContainer}>
                      {[
                        { value: "IN_APP", label: "In-App" },
                        { value: "EMAIL", label: "E-mail" },
                        { value: "PUSH", label: "Push Mobile" },
                        { value: "WHATSAPP", label: "WhatsApp" },
                      ].map((channel) => {
                        const isSelected = value?.includes(channel.value);
                        return (
                          <View key={channel.value} style={styles.checkboxRow}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...(value || []), channel.value]
                                  : value?.filter((v) => v !== channel.value) || [];
                                onChange(updatedValue);
                              }}
                              disabled={isSending}
                            />
                            <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
                              {channel.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Target Audience */}
            <FormCard
              title="Destinatários"
              subtitle="Selecione quem receberá esta notificação"
            >
              {/* Target Type Selection */}
              <FormFieldGroup
                label="Enviar para"
                required
                error={form.formState.errors.targetType?.message}
              >
                <Controller
                  control={form.control}
                  name="targetType"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={targetTypeOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione os destinatários"
                      disabled={isSending}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Sectors Selection (when targetType is "sectors") */}
              {targetType === "sectors" && (
                <FormFieldGroup
                  label="Setores"
                  required
                  error={form.formState.errors.targetSectors?.message}
                  helper={
                    targetSectors.length === 0
                      ? "Selecione pelo menos um setor para continuar"
                      : `${targetSectors.length} setor${targetSectors.length !== 1 ? "es" : ""} selecionado${targetSectors.length !== 1 ? "s" : ""}`
                  }
                >
                  <Controller
                    control={form.control}
                    name="targetSectors"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        async
                        queryKey={sectorKeys.lists()}
                        queryFn={fetchSectors}
                        minSearchLength={0}
                        pageSize={50}
                        mode="multiple"
                        value={value || []}
                        onValueChange={onChange}
                        placeholder="Selecione os setores"
                        disabled={isSending}
                        searchable
                        emptyText="Nenhum setor encontrado"
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {/* Users Selection (when targetType is "users") */}
              {targetType === "users" && (
                <FormFieldGroup
                  label="Usuários"
                  required
                  error={form.formState.errors.targetUsers?.message}
                  helper={
                    targetUsers.length === 0
                      ? "Selecione pelo menos um usuário para continuar"
                      : `${targetUsers.length} usuário${targetUsers.length !== 1 ? "s" : ""} selecionado${targetUsers.length !== 1 ? "s" : ""}`
                  }
                >
                  <Controller
                    control={form.control}
                    name="targetUsers"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        async
                        queryKey={userKeys.list({ status: { not: USER_STATUS.DISMISSED } })}
                        queryFn={fetchUsers}
                        minSearchLength={0}
                        pageSize={50}
                        mode="multiple"
                        value={value || []}
                        onValueChange={onChange}
                        placeholder="Selecione os usuários"
                        disabled={isSending}
                        searchable
                        emptyText="Nenhum usuário ativo encontrado"
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormCard>

            {/* Scheduling */}
            <FormCard
              title="Agendamento"
              subtitle="Enviar agora ou agendar para mais tarde"
            >
              <FormFieldGroup label="Agendar para depois">
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                    Defina data e hora para envio automático
                  </Text>
                  <Switch
                    value={scheduleLater}
                    onValueChange={setScheduleLater}
                    disabled={isSending}
                  />
                </View>
              </FormFieldGroup>

              {scheduleLater && (
                <FormFieldGroup
                  label="Data e Hora"
                  error={form.formState.errors.scheduledAt?.message}
                >
                  <Controller
                    control={form.control}
                    name="scheduledAt"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker
                        value={value}
                        onChange={onChange}
                        placeholder="Selecione data e hora"
                        disabled={isSending}
                        mode="datetime"
                      />
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isSending}
          canSubmit={canSubmit}
          submitLabel={scheduleLater ? "Agendar" : "Enviar Agora"}
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 14,
    flex: 1,
  },
});
