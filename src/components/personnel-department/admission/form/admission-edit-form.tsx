// admission-edit-form.tsx (mobile)
// Editing an existing admission. The collaborator/vínculo data is immutable here
// (it lives in the colaborador/vínculo flow); only the admission-level fields are
// editable per the API admissionUpdateSchema: { hireDate?, notes? }.

import { useState } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";

import { admissionUpdateSchema } from "@/schemas/admission";
import type { AdmissionUpdateFormData } from "@/schemas/admission";
import type { Admission } from "@/types";
import { useAdmissionMutations } from "@/hooks/useAdmission";

interface AdmissionEditFormProps {
  admission: Admission;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export function AdmissionEditForm({ admission, onSuccess, onCancel }: AdmissionEditFormProps) {
  const nav = useNav();
  const { colors } = useTheme();
  const { updateAsync, updateMutation } = useAdmissionMutations();

  const form = useForm<AdmissionUpdateFormData>({
    resolver: zodResolver(admissionUpdateSchema as any),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      hireDate: toDate(admission.hireDate) ?? null,
      notes: admission.notes ?? null,
    } as any,
  });

  const isLoading = updateMutation.isPending;

  const handleSubmit = async (data: AdmissionUpdateFormData) => {
    try {
      await updateAsync({ id: admission.id, data });
      if (onSuccess) onSuccess(admission.id);
      else nav.replace(mobileRoute(`/departamento-pessoal/admissoes/detalhes/${admission.id}`));
    } catch {
      // Error toast shown automatically by the axios response interceptor.
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else nav.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FormCard title="Processo de Admissão" icon="IconUserPlus">
            <FormFieldGroup label="Data de Admissão" error={(form.formState.errors as any).hireDate?.message}>
              <Controller
                control={form.control}
                name="hireDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker value={value ?? undefined} onChange={onChange} placeholder="Selecione a data" disabled={isLoading} />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Observações" error={(form.formState.errors as any).notes?.message}>
              <Controller
                control={form.control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    value={(value as string | null) || ""}
                    onChangeText={(t: string) => onChange(t === "" ? null : t)}
                    onBlur={onBlur}
                    placeholder="Observações sobre o processo de admissão (opcional)"
                    multiline
                    numberOfLines={4}
                    editable={!isLoading}
                  />
                )}
              />
            </FormFieldGroup>
          </FormCard>
          <View style={{ height: 16 }} />
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          canSubmit={form.formState.isDirty}
          submitLabel="Atualizar"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
  },
});
