import { useMemo } from "react";
import { ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";

import { sectorCreateSchema, sectorUpdateSchema } from "@/schemas/sector";
import type { SectorCreateFormData, SectorUpdateFormData } from "@/schemas/sector";
import type { Sector } from "@/types";
import { useSectorMutations } from "@/hooks/useSector";
import { SECTOR_PRIVILEGES, SECTOR_PRIVILEGES_LABELS } from "@/constants";

interface SectorFormProps {
  mode: "create" | "update";
  sector?: Sector;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SectorForm({ mode, sector, onSuccess, onCancel }: SectorFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, updateAsync, createMutation, updateMutation } = useSectorMutations();

  const form = useForm<SectorCreateFormData | SectorUpdateFormData>({
    resolver: zodResolver(mode === "create" ? sectorCreateSchema : sectorUpdateSchema),
    defaultValues:
      mode === "create"
        ? {
            name: "",
            privileges: SECTOR_PRIVILEGES.BASIC,
          }
        : {
            name: sector?.name || "",
            privileges: sector?.privileges || SECTOR_PRIVILEGES.BASIC,
          },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const handleSubmit = async (data: SectorCreateFormData | SectorUpdateFormData) => {
    try {
      if (mode === "create") {
        await createAsync(data as SectorCreateFormData);
      } else if (sector) {
        await updateAsync({
          id: sector.id,
          data: data as SectorUpdateFormData,
        });
      }
      onSuccess?.();
      router.back();
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Ocorreu um erro ao salvar o setor");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  // Define privilege descriptions and order (matching web version)
  // Note: Team leadership is now determined by managedSector relationship, not LEADER privilege
  const privilegeInfo = {
    [SECTOR_PRIVILEGES.BASIC]: { order: 1, description: "Acesso básico aos recursos do sistema" },
    [SECTOR_PRIVILEGES.EXTERNAL]: { order: 2, description: "Acesso para colaboradores externos" },
    [SECTOR_PRIVILEGES.WAREHOUSE]: { order: 3, description: "Controle de estoque e almoxarifado" },
    [SECTOR_PRIVILEGES.DESIGNER]: { order: 4, description: "Design e criação de artes" },
    [SECTOR_PRIVILEGES.PRODUCTION]: { order: 5, description: "Gestão de produção e tarefas" },
    [SECTOR_PRIVILEGES.MAINTENANCE]: { order: 6, description: "Manutenção e equipamentos" },
    [SECTOR_PRIVILEGES.LOGISTIC]: { order: 7, description: "Logística e transporte" },
    [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: { order: 8, description: "Recursos humanos e pessoal" },
    [SECTOR_PRIVILEGES.FINANCIAL]: { order: 9, description: "Controle financeiro e orçamentário" },
    [SECTOR_PRIVILEGES.ADMIN]: { order: 10, description: "Administração completa do sistema" },
    [SECTOR_PRIVILEGES.COMMERCIAL]: { order: 11, description: "Gestão comercial e vendas" },
    [SECTOR_PRIVILEGES.LEADER]: { order: 12, description: "Liderança de equipe" },
    [SECTOR_PRIVILEGES.PLOTTING]: { order: 13, description: "Plotagem e impressão" },
  };

  // Sort privileges by order (matching web version)
  const sortedPrivileges = Object.entries(SECTOR_PRIVILEGES_LABELS).sort(
    ([a], [b]) => privilegeInfo[a as keyof typeof privilegeInfo].order - privilegeInfo[b as keyof typeof privilegeInfo].order,
  );

  const privilegeOptions: ComboboxOption[] = sortedPrivileges.map(([value, label]) => ({
    value,
    label,
  }));

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
            <FormCard
              title="Informações do Setor"
              icon="IconBuilding"
            >
              {/* Name */}
              <FormFieldGroup
                label="Nome do Setor"
                required
                helper={(() => {
                  const characterCount = (form.watch("name") || "").length;
                  return `Nome único para identificar o setor · ${characterCount}/100`;
                })()}
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
                      placeholder="Ex: Recursos Humanos, Produção, Financeiro"
                      editable={!isLoading}
                      error={!!form.formState.errors.name}
                      maxLength={100}
                    />
                  )}
                />
              </FormFieldGroup>

              {/* Privileges */}
              <FormFieldGroup
                label="Privilégios"
                required
                helper={(() => {
                  const currentValue = form.watch("privileges");
                  if (currentValue && privilegeInfo[currentValue as keyof typeof privilegeInfo]) {
                    return privilegeInfo[currentValue as keyof typeof privilegeInfo].description;
                  }
                  return undefined;
                })()}
                error={form.formState.errors.privileges?.message}
              >
                <Controller
                  control={form.control}
                  name="privileges"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={privilegeOptions}
                      value={value}
                      onValueChange={onChange}
                      placeholder="Selecione os privilégios do setor"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
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
});
