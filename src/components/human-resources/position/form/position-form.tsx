import { useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { routeToMobilePath } from "@/utils/route-mapper";
import { routes } from "@/constants";

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
  const { handlers, refs } = useKeyboardAwareScroll();
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
            remuneration: undefined,
            bonifiable: position?.bonifiable,
            hierarchy: position?.hierarchy ?? undefined,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (data: PositionCreateFormData | PositionUpdateFormData) => {
    try {
      if (mode === "create") {
        const result = await createAsync(data as PositionCreateFormData);
        const newId = (result as any)?.data?.id || (result as any)?.id;
        onSuccess?.();
        if (newId) {
          router.replace(routeToMobilePath(routes.humanResources.positions.details(newId)) as any);
        } else {
          router.back();
        }
      } else if (position) {
        await updateAsync({
          id: position.id,
          data: data as PositionUpdateFormData,
        });
        onSuccess?.();
        router.replace(routeToMobilePath(routes.humanResources.positions.details(position.id)) as any);
      }
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
          <FormCard title="Informações do Cargo" icon="IconBriefcase">
          {/* Name */}
          <FormFieldGroup
            label="Nome"
            required
            error={form.formState.errors.name?.message}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Nome do cargo"
                  editable={!isLoading}
                  error={!!form.formState.errors.name}
                />
              )}
            />
          </FormFieldGroup>

          {/* Remuneration */}
          <FormFieldGroup
            label="Remuneração"
            required={mode === "create"}
            helper={mode === "update" ? "Deixe em branco para manter a remuneração atual. Ao atualizar, um novo registro será criado no histórico." : undefined}
            error={form.formState.errors.remuneration?.message}
          >
            <Controller
              control={form.control}
              name="remuneration"
              render={({ field: { onChange, value } }) => (
                <Input
                  type="currency"
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="R$ 0,00"
                  editable={!isLoading}
                  error={!!form.formState.errors.remuneration}
                />
              )}
            />
          </FormFieldGroup>

          {/* Hierarchy */}
          <FormFieldGroup
            label="Hierarquia"
            helper="Valor entre 0 e 999. Maior hierarquia = número maior."
            error={form.formState.errors.hierarchy?.message}
          >
            <Controller
              control={form.control}
              name="hierarchy"
              render={({ field: { onChange, value } }) => (
                <Input
                  type="integer"
                  value={value ?? undefined}
                  onChange={onChange}
                  placeholder="0"
                  min={0}
                  max={999}
                  editable={!isLoading}
                  error={!!form.formState.errors.hierarchy}
                />
              )}
            />
          </FormFieldGroup>

          {/* Bonifiable */}
          <FormFieldGroup
            label="Bonificável"
            helper="Cargo recebe bonificação por desempenho"
          >
            <View style={styles.switchRow}>
              <Controller
                control={form.control}
                name="bonifiable"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    checked={value || false}
                    onCheckedChange={onChange}
                    disabled={isLoading}
                  />
                )}
              />
            </View>
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
  fieldGroup: {
    gap: spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
