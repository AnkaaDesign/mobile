import { useState, useMemo, useCallback } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, Text } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { FormSteps, type FormStep } from "@/components/ui/form-steps";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { useNavigationHistory } from "@/contexts/navigation-history-context";

import type { User, Sector } from "@/types";
import { getUsers, getSectors, getPositions } from "@/api-client";
import { userKeys, sectorKeys, positionKeys } from "@/hooks/queryKeys";
import { createMessage, updateMessage } from "@/api-client/message";
import { messageKeys } from "@/hooks/queryKeys";
import { useQueryClient } from "@tanstack/react-query";

import { BlockEditorCanvas, generateBlockId } from "./editor";
import { MessageOverviewStep } from "./message-overview-step";
import type { ContentBlock } from "./editor/types";

// =====================
// Steps Definition (matching web: metadata → content → overview)
// =====================

const steps: FormStep[] = [
  { id: 1, name: "Informações", description: "Título, público-alvo e agendamento" },
  { id: 2, name: "Conteúdo", description: "Texto da mensagem" },
  { id: 3, name: "Revisão", description: "Confirme antes de salvar" },
];

// =====================
// Form Schema (matching web version)
// =====================

const messageFormSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  blocks: z.array(z.any()).min(1, "Adicione pelo menos um bloco de conteúdo"),
  targetType: z.enum(["all", "specific", "sector", "position"]),
  targetUsers: z.array(z.string()).optional(),
  targetSectors: z.array(z.string()).optional(),
  targetPositions: z.array(z.string()).optional(),
  isActive: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

interface MessageFormData {
  title: string;
  blocks: ContentBlock[];
  targetType: "all" | "specific" | "sector" | "position";
  targetUsers?: string[];
  targetSectors?: string[];
  targetPositions?: string[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

// =====================
// Status Labels for overview
// =====================

const TARGET_TYPE_LABELS: Record<string, string> = {
  all: "Todos os Usuários (Broadcast)",
  specific: "Usuários Específicos",
  sector: "Por Setor",
  position: "Por Cargo",
};

interface MessageFormProps {
  mode: "create" | "update";
  message?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MessageForm({ mode, message, onSuccess, onCancel }: MessageFormProps) {
  const { goBack } = useNavigationHistory();
  const { colors } = useTheme();
  const { handlers, refs, getContentPadding } = useKeyboardAwareScroll();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();

  // Async query function for paginated user fetching
  const fetchUsers = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getUsers({
      searchingFor: searchTerm || undefined,
      where: { isActive: true },
      orderBy: { name: "asc" },
      page,
      limit: pageSize,
      select: { id: true, name: true, email: true },
    });
    return {
      data: response.data?.map((user: User) => ({
        value: user.id,
        label: user.email ? `${user.name} (${user.email})` : user.name,
      })) || [],
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.totalRecords,
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
        value: sector.id,
        label: sector.name,
      })) || [],
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.totalRecords,
    };
  }, []);

  // Async query function for paginated position fetching
  const fetchPositions = useCallback(async (searchTerm: string, page: number = 1) => {
    const pageSize = 50;
    const response = await getPositions({
      searchingFor: searchTerm || undefined,
      orderBy: { name: "asc" },
      page,
      limit: pageSize,
    });
    return {
      data: response.data?.map((position: any) => ({
        value: position.id,
        label: position.name,
      })) || [],
      hasMore: response.meta?.hasNextPage ?? false,
      total: response.meta?.totalRecords,
    };
  }, []);

  // Extract content blocks for editing
  const getContentBlocks = useCallback((content: any): ContentBlock[] => {
    if (!content) return [];
    if (Array.isArray(content)) return content;
    if (content.blocks) return content.blocks;
    // Fallback for old plain-text format
    if (typeof content === 'string') {
      return content.split('\n').filter((l: string) => l.trim()).map((line: string) => ({
        id: generateBlockId(),
        type: 'paragraph' as const,
        content: line.trim(),
        fontSize: 'base' as const,
        fontWeight: 'normal' as const,
      }));
    }
    return [];
  }, []);

  // Get initial target user IDs
  const initialTargetUsers = useMemo(() => {
    if (!message?.targets) return [];
    return message.targets.map((t: any) => t.userId || t.user?.id || t.id).filter(Boolean);
  }, [message?.targets]);

  // Determine initial target type
  const initialTargetType = useMemo(() => {
    if (!message) return "specific";
    if (message.targetCount === 0 && (!message.targets || message.targets.length === 0)) return "all";
    return "specific";
  }, [message]);

  const defaultScheduling = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);
    return { startDate: today, endDate };
  }, []);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      title: message?.title || "",
      blocks: getContentBlocks(message?.content),
      targetType: initialTargetType,
      targetUsers: initialTargetUsers,
      targetSectors: [],
      targetPositions: [],
      isActive: message?.status === 'ACTIVE' || mode === 'create',
      startDate: message?.startsAt ? new Date(message.startsAt) : defaultScheduling.startDate,
      endDate: message?.endsAt ? new Date(message.endsAt) : defaultScheduling.endDate,
    },
    mode: "onTouched",
  });

  const targetType = form.watch("targetType");
  const targetUsers = form.watch("targetUsers") || [];
  const targetSectors = form.watch("targetSectors") || [];
  const targetPositions = form.watch("targetPositions") || [];
  const title = form.watch("title");
  const blocks = form.watch("blocks") || [];
  const isActive = form.watch("isActive");

  // Targeting valid check
  const isTargetingValid =
    targetType === "all" ||
    (targetType === "specific" && targetUsers.length > 0) ||
    (targetType === "sector" && targetSectors.length > 0) ||
    (targetType === "position" && targetPositions.length > 0);

  // Step validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: {
        const titleValid = await form.trigger("title");
        if (!titleValid) return false;
        if (!isTargetingValid) {
          if (targetType === "specific") {
            form.setError("targetUsers", { type: "manual", message: "Selecione pelo menos um usuário" });
          } else if (targetType === "sector") {
            form.setError("targetSectors", { type: "manual", message: "Selecione pelo menos um setor" });
          } else if (targetType === "position") {
            form.setError("targetPositions", { type: "manual", message: "Selecione pelo menos um cargo" });
          }
          return false;
        }
        return true;
      }
      case 2: {
        const contentValid = await form.trigger("blocks");
        if (!contentValid) return false;
        if (blocks.length === 0) {
          form.setError("blocks", { type: "manual", message: "Adicione pelo menos um bloco de conteúdo" });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }, [currentStep, form, isTargetingValid, targetType, blocks]);

  // Navigation
  const nextStep = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  }, [validateCurrentStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  // Get target count text for overview
  const getTargetSummary = () => {
    switch (targetType) {
      case "all": return "Todos os usuários";
      case "specific": return `${targetUsers.length} usuário${targetUsers.length !== 1 ? "s" : ""} selecionado${targetUsers.length !== 1 ? "s" : ""}`;
      case "sector": return `${targetSectors.length} setor${targetSectors.length !== 1 ? "es" : ""} selecionado${targetSectors.length !== 1 ? "s" : ""}`;
      case "position": return `${targetPositions.length} cargo${targetPositions.length !== 1 ? "s" : ""} selecionado${targetPositions.length !== 1 ? "s" : ""}`;
      default: return "-";
    }
  };

  const handleSubmit = async (data: MessageFormData) => {
    try {
      setIsSubmitting(true);

      const payload: any = {
        title: data.title,
        contentBlocks: data.blocks,
        isActive: data.isActive,
      };

      // Add targeting
      if (data.targetType === "all") {
        payload.targets = [];
      } else if (data.targetType === "specific") {
        payload.targets = data.targetUsers || [];
      } else if (data.targetType === "sector") {
        payload.targetSectors = data.targetSectors || [];
      } else if (data.targetType === "position") {
        payload.targetPositions = data.targetPositions || [];
      }

      if (mode === "create") {
        await createMessage(payload);
        Alert.alert("Sucesso", "Mensagem criada com sucesso", [
          { text: "OK", onPress: () => { onSuccess?.(); goBack(); } },
        ]);
      } else if (message?.id) {
        await updateMessage(message.id, payload);
        Alert.alert("Sucesso", "Mensagem atualizada com sucesso", [
          { text: "OK", onPress: () => { onSuccess?.(); goBack(); } },
        ]);
      }

      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    } catch (error: any) {
      Alert.alert("Erro", error?.message || `Erro ao ${mode === "create" ? "criar" : "atualizar"} mensagem`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      goBack();
    }
  };

  const targetTypeOptions: ComboboxOption[] = [
    { value: "all", label: "Todos os Usuários (Broadcast)" },
    { value: "specific", label: "Usuários Específicos" },
    { value: "sector", label: "Por Setor" },
    { value: "position", label: "Por Cargo" },
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: getContentPadding(spacing.lg) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Step Indicator */}
            <FormSteps steps={steps} currentStep={currentStep} />

            {/* ===== Step 1: Metadata (Title + Targeting) ===== */}
            {currentStep === 1 && (
              <View>
                {/* Basic Information */}
                <FormCard
                  title="Informações Básicas"
                  subtitle="Defina o título da mensagem"
                >
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
                          placeholder="Digite o título da mensagem"
                          editable={!isSubmitting}
                          error={!!form.formState.errors.title}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormCard>

                {/* Target Audience */}
                <FormCard
                  title="Público Alvo"
                  subtitle="Selecione quem receberá esta mensagem"
                >
                  <FormFieldGroup
                    label="Tipo de Público"
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
                          placeholder="Selecione o tipo de público"
                          disabled={isSubmitting}
                          searchable={false}
                          clearable={false}
                          error={error?.message}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  {/* Users Selection */}
                  {targetType === "specific" && (
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
                            queryKey={[...userKeys.lists()]}
                            queryFn={fetchUsers}
                            minSearchLength={0}
                            pageSize={50}
                            mode="multiple"
                            value={value || []}
                            onValueChange={onChange}
                            placeholder="Selecione os usuários"
                            disabled={isSubmitting}
                            searchable
                            emptyText="Nenhum usuário ativo encontrado"
                            error={error?.message}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  )}

                  {/* Sectors Selection */}
                  {targetType === "sector" && (
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
                            queryKey={[...sectorKeys.lists()]}
                            queryFn={fetchSectors}
                            minSearchLength={0}
                            pageSize={50}
                            mode="multiple"
                            value={value || []}
                            onValueChange={onChange}
                            placeholder="Selecione os setores"
                            disabled={isSubmitting}
                            searchable
                            emptyText="Nenhum setor encontrado"
                            error={error?.message}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  )}

                  {/* Positions Selection */}
                  {targetType === "position" && (
                    <FormFieldGroup
                      label="Cargos"
                      required
                      error={form.formState.errors.targetPositions?.message}
                      helper={
                        targetPositions.length === 0
                          ? "Selecione pelo menos um cargo para continuar"
                          : `${targetPositions.length} cargo${targetPositions.length !== 1 ? "s" : ""} selecionado${targetPositions.length !== 1 ? "s" : ""}`
                      }
                    >
                      <Controller
                        control={form.control}
                        name="targetPositions"
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                          <Combobox
                            async
                            queryKey={[...positionKeys.lists()]}
                            queryFn={fetchPositions}
                            minSearchLength={0}
                            pageSize={50}
                            mode="multiple"
                            value={value || []}
                            onValueChange={onChange}
                            placeholder="Selecione os cargos"
                            disabled={isSubmitting}
                            searchable
                            emptyText="Nenhum cargo encontrado"
                            error={error?.message}
                          />
                        )}
                      />
                    </FormFieldGroup>
                  )}
                </FormCard>

                {/* Publication Status */}
                <FormCard
                  title="Publicação"
                  subtitle="Defina se a mensagem será publicada imediatamente"
                >
                  <FormFieldGroup label="Publicar imediatamente">
                    <View style={styles.switchRow}>
                      <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                        A mensagem ficará ativa e visível para os destinatários
                      </Text>
                      <Controller
                        control={form.control}
                        name="isActive"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            checked={value}
                            onCheckedChange={onChange}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </View>
                  </FormFieldGroup>
                </FormCard>
              </View>
            )}

            {/* ===== Step 2: Content (Block Editor) ===== */}
            {currentStep === 2 && (
              <View>
                <FormCard
                  title="Conteúdo da Mensagem"
                  subtitle="Crie o conteúdo usando blocos"
                >
                  <Controller
                    control={form.control}
                    name="blocks"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <>
                        <BlockEditorCanvas
                          blocks={(value as ContentBlock[]) || []}
                          onBlocksChange={onChange}
                          disabled={isSubmitting}
                        />
                        {error?.message && (
                          <ThemedText style={[styles.errorText, { color: '#EF4444' }]}>
                            {error.message}
                          </ThemedText>
                        )}
                      </>
                    )}
                  />
                </FormCard>
              </View>
            )}

            {/* ===== Step 3: Overview / Review ===== */}
            {currentStep === 3 && (
              <MessageOverviewStep
                title={title}
                targetTypeLabel={TARGET_TYPE_LABELS[targetType] || "-"}
                targetSummary={getTargetSummary()}
                isActive={isActive}
                blocks={blocks as ContentBlock[]}
              />
            )}
          </KeyboardAwareFormProvider>
        </ScrollView>

        {/* Action Bar */}
        <FormActionBar
          onCancel={isFirstStep ? handleCancel : prevStep}
          onSubmit={isLastStep ? form.handleSubmit(handleSubmit) : nextStep}
          isSubmitting={isSubmitting}
          canSubmit={isLastStep ? true : (currentStep !== 1 || (title.trim().length > 0 && isTargetingValid))}
          cancelLabel={isFirstStep ? "Cancelar" : "Voltar"}
          submitLabel={isLastStep ? (mode === "create" ? "Criar Mensagem" : "Salvar Alterações") : "Próximo"}
          showCancel={true}
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
  },
});
