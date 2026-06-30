import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconStethoscope } from "@tabler/icons-react-native";

import { StandardModal } from "@/components/ui/standard-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { FormFieldGroup } from "@/components/ui/form-section";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

import { medicalExamCompleteSchema, type MedicalExamCompleteFormData } from "@/schemas/medical-exam";
import { useCompleteMedicalExam, useUploadMedicalExamDocument } from "@/hooks/useMedicalExam";
import type { MedicalExam } from "@/types";
import { MEDICAL_EXAM_RESULT, MEDICAL_EXAM_RESULT_LABELS, MEDICAL_EXAM_TYPE } from "@/constants";

interface MedicalExamCompleteDialogProps {
  exam: MedicalExam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

const resultOptions: ComboboxOption[] = [
  { value: MEDICAL_EXAM_RESULT.FIT, label: MEDICAL_EXAM_RESULT_LABELS[MEDICAL_EXAM_RESULT.FIT] },
  { value: MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS, label: MEDICAL_EXAM_RESULT_LABELS[MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS] },
  { value: MEDICAL_EXAM_RESULT.UNFIT, label: MEDICAL_EXAM_RESULT_LABELS[MEDICAL_EXAM_RESULT.UNFIT] },
];

/** Soma `months` meses a uma data (validade do ASO periódico: 12 ou 24 meses). */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function MedicalExamCompleteDialog({ exam, open, onOpenChange, onCompleted }: MedicalExamCompleteDialogProps) {
  const { colors } = useTheme();
  const completeMutation = useCompleteMedicalExam();
  const uploadMutation = useUploadMedicalExamDocument();
  const [asoFiles, setAsoFiles] = useState<FilePickerItem[]>([]);

  const form = useForm<MedicalExamCompleteFormData>({
    resolver: zodResolver(medicalExamCompleteSchema),
    defaultValues: {
      examDate: new Date(),
      result: "" as any,
      restrictions: "",
      periodicityMonths: null,
      expiresAt: null,
      physicianName: "",
      crm: "",
      clinic: "",
    },
    mode: "onTouched",
  });

  // Re-prefill when the dialog opens for a (new) exam.
  useEffect(() => {
    if (open && exam) {
      form.reset({
        examDate: exam.examDate ? new Date(exam.examDate) : exam.scheduledAt ? new Date(exam.scheduledAt) : new Date(),
        result: "" as any,
        restrictions: exam.restrictions ?? "",
        periodicityMonths: exam.periodicityMonths ?? null,
        expiresAt: exam.expiresAt ? new Date(exam.expiresAt) : null,
        physicianName: exam.physicianName ?? "",
        crm: exam.crm ?? "",
        clinic: exam.clinic ?? "",
      });
      setAsoFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, exam?.id]);

  const isSubmitting = completeMutation.isPending || uploadMutation.isPending;

  const selectedResult = form.watch("result");
  const requiresRestrictions = selectedResult === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS;
  const isPeriodic = exam?.type === MEDICAL_EXAM_TYPE.PERIODIC;

  /**
   * Validade = data do exame + 12/24 meses. Também grava a periodicidade (em meses)
   * para que o próximo periódico seja agendado automaticamente pelo backend.
   */
  const applyExpiresPreset = (months: number) => {
    const baseDate = form.getValues("examDate");
    form.setValue("expiresAt", addMonths(baseDate ? new Date(baseDate) : new Date(), months), { shouldDirty: true });
    if (isPeriodic) {
      form.setValue("periodicityMonths", months, { shouldDirty: true });
    }
  };

  const handleSubmit = async (data: MedicalExamCompleteFormData) => {
    if (!exam) return;

    // Restrições são obrigatórias quando o resultado é "Apto com restrições".
    if (data.result === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS && !data.restrictions?.trim()) {
      form.setError("restrictions", { type: "manual", message: "Descreva as restrições para o resultado 'Apto com restrições'" });
      return;
    }

    try {
      await completeMutation.mutateAsync({
        id: exam.id,
        data: {
          ...data,
          restrictions: data.result === MEDICAL_EXAM_RESULT.FIT_WITH_RESTRICTIONS ? data.restrictions?.trim() || null : null,
          periodicityMonths: isPeriodic ? data.periodicityMonths ?? null : null,
          physicianName: data.physicianName || null,
          crm: data.crm || null,
          clinic: data.clinic || null,
        },
      });

      // Anexa o ASO depois de concluir — o servidor vincula o arquivo e (para
      // exames DEMISSIONAIS) sincroniza o documento DISMISSAL_EXAM da rescisão.
      const aso = asoFiles[0];
      if (aso) {
        await uploadMutation.mutateAsync({
          id: exam.id,
          file: {
            uri: aso.uri,
            name: aso.name,
            type: aso.mimeType || aso.type || "application/octet-stream",
          },
        });
      }

      onOpenChange(false);
      onCompleted?.();
    } catch {
      // Error toast is shown automatically by the axios response interceptor.
    }
  };

  return (
    <StandardModal
      visible={open}
      onClose={() => !isSubmitting && onOpenChange(false)}
      title="Concluir Exame"
      subtitle={`Registre o resultado do exame${exam?.user?.name ? ` de ${exam.user.name}` : ""}. O exame será marcado como realizado.`}
      icon={IconStethoscope}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: () => onOpenChange(false), disabled: isSubmitting },
        { label: "Concluir Exame", onPress: form.handleSubmit(handleSubmit), disabled: isSubmitting, loading: isSubmitting },
      ]}
    >
            <FormFieldGroup label="Data do Exame" required error={form.formState.errors.examDate?.message}>
              <Controller
                control={form.control}
                name="examDate"
                render={({ field: { onChange, value } }) => (
                  <DatePicker value={value || undefined} onChange={onChange} placeholder="Selecione a data" disabled={isSubmitting} />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Resultado" required error={form.formState.errors.result?.message}>
              <Controller
                control={form.control}
                name="result"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Combobox
                    options={resultOptions}
                    value={value}
                    onValueChange={onChange}
                    placeholder="Selecione o resultado"
                    disabled={isSubmitting}
                    searchable={false}
                    clearable={false}
                    error={error?.message}
                  />
                )}
              />
            </FormFieldGroup>

            {requiresRestrictions && (
              <FormFieldGroup label="Restrições" required error={form.formState.errors.restrictions?.message}>
                <Controller
                  control={form.control}
                  name="restrictions"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Textarea
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Descreva as restrições (ex.: não operar máquinas, evitar esforço físico...)"
                      numberOfLines={3}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>
            )}

            {isPeriodic && (
              <FormFieldGroup
                label="Periodicidade do próximo exame (meses)"
                helper="Define quando o próximo periódico será agendado automaticamente."
                error={(form.formState.errors as any).periodicityMonths?.message}
              >
                <Controller
                  control={form.control}
                  name="periodicityMonths"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      type="integer"
                      value={value ?? undefined}
                      onChange={onChange}
                      placeholder="12 (risco) ou 24"
                      min={1}
                      max={120}
                      editable={!isSubmitting}
                    />
                  )}
                />
              </FormFieldGroup>
            )}

            <FormFieldGroup
              label="Validade"
              helper="Periódico: 12 meses (exposição a risco) ou 24 meses, a partir da data do exame"
              error={form.formState.errors.expiresAt?.message}
            >
              <Controller
                control={form.control}
                name="expiresAt"
                render={({ field: { onChange, value } }) => (
                  <DatePicker value={value || undefined} onChange={onChange} placeholder="Selecione a data" disabled={isSubmitting} />
                )}
              />
              <View style={styles.presetRow}>
                <Button variant="outline" size="sm" onPress={() => applyExpiresPreset(12)} disabled={isSubmitting}>
                  +12 meses
                </Button>
                <Button variant="outline" size="sm" onPress={() => applyExpiresPreset(24)} disabled={isSubmitting}>
                  +24 meses
                </Button>
              </View>
            </FormFieldGroup>

            {/* Documento ASO (opcional) — enviado logo após a conclusão. */}
            <FormFieldGroup label="Documento ASO">
              <FilePicker
                value={asoFiles}
                onChange={setAsoFiles}
                maxFiles={1}
                multiple={false}
                placeholder="Anexar ASO"
                helperText="Opcional — o ASO também pode ser anexado depois, na página do exame."
                acceptedFileTypes={["application/pdf", "image/*"]}
                disabled={isSubmitting}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Médico" error={form.formState.errors.physicianName?.message}>
              <Controller
                control={form.control}
                name="physicianName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Nome do médico" editable={!isSubmitting} />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="CRM" error={form.formState.errors.crm?.message}>
              <Controller
                control={form.control}
                name="crm"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="CRM do médico" editable={!isSubmitting} />
                )}
              />
            </FormFieldGroup>

            <FormFieldGroup label="Clínica" error={form.formState.errors.clinic?.message}>
              <Controller
                control={form.control}
                name="clinic"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Nome da clínica" editable={!isSubmitting} />
                )}
              />
            </FormFieldGroup>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
