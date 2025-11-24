import React from "react";
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { SimpleFormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { spacing } from "@/constants/design-system";

import { sectorCreateSchema, sectorUpdateSchema } from "@/schemas/sector";
import type { SectorCreateFormData, SectorUpdateFormData } from "@/schemas/sector";
import type { Sector } from "@/types";
import { useSectorMutations } from "@/hooks/useSector";
import { SECTOR_PRIVILEGES } from "@/constants";

interface SectorFormProps {
  mode: "create" | "update";
  sector?: Sector;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRIVILEGE_LABELS: Record<string, string> = {
  [SECTOR_PRIVILEGES.BASIC]: "Básico",
  [SECTOR_PRIVILEGES.ADVANCED]: "Avançado",
  [SECTOR_PRIVILEGES.FULL]: "Completo",
};

export function SectorForm({ mode, sector, onSuccess, onCancel }: SectorFormProps) {
  const router = useRouter();
  const { colors } = useTheme();
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

  const privilegeOptions: ComboboxOption[] = Object.entries(PRIVILEGE_LABELS).map(
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
        <FormCard
          title="Informações do Setor"
          subtitle="Preencha os dados do setor"
        >
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
                  placeholder="Digite o nome do setor"
                  editable={!isLoading}
                  error={!!form.formState.errors.name}
                />
              )}
            />
          </FormFieldGroup>

          {/* Privileges */}
          <FormFieldGroup
            label="Privilégios"
            required
            helper="Define o nível de acesso do setor no sistema"
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
                  placeholder="Selecione o nível de privilégio"
                  disabled={isLoading}
                  searchable={false}
                  clearable={false}
                  error={error?.message}
                />
              )}
            />
          </FormFieldGroup>
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
