import { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { ThemedText } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { StandardModal } from "@/components/ui/standard-modal";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import {
  CUT_REQUEST_REASON,
  CUT_ORIGIN,
  CUT_REQUEST_REASON_LABELS,
  CUT_TYPE_LABELS,
} from "@/constants";
import { useCutBatchMutations } from "@/hooks";
import type { Cut } from "@/types";
import { IconCut } from "@tabler/icons-react-native";

const requestSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantidade deve ser um número inteiro")
    .min(1, "Quantidade deve ser maior que zero")
    .max(100, "Quantidade não pode exceder 100"),
  reason: z.nativeEnum(CUT_REQUEST_REASON, {
    errorMap: () => ({ message: "Motivo inválido" }),
  }),
});

type RequestFormData = z.infer<typeof requestSchema>;

interface CutRequestModalProps {
  visible: boolean;
  onClose: () => void;
  cutItem: Cut | null;
  onSuccess?: (cuts: Cut[]) => void;
}

export function CutRequestModal({
  visible,
  onClose,
  cutItem,
  onSuccess,
}: CutRequestModalProps) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchCreateAsync } = useCutBatchMutations();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    trigger,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      quantity: 1,
      reason: CUT_REQUEST_REASON.WRONG_APPLY,
    },
    mode: "onChange",
  });

  // Trigger validation when modal opens to ensure isValid is correct with default values
  useEffect(() => {
    if (visible && cutItem) {
      trigger();
    }
  }, [visible, cutItem, trigger]);

  const quantity = watch("quantity");
  const reason = watch("reason");

  const onSubmit = async (data: RequestFormData) => {
    if (!cutItem) {
      Alert.alert("Erro", "Nenhum corte selecionado");
      return;
    }

    setIsSubmitting(true);
    try {
      const { quantity, ...requestData } = data;

      // Create multiple new cuts based on the original cut
      const cuts = Array.from({ length: quantity }, () => ({
        fileId: cutItem.fileId,
        type: cutItem.type,
        origin: CUT_ORIGIN.REQUEST,
        reason: requestData.reason,
        parentCutId: cutItem.id,
        ...(cutItem.taskId && { taskId: cutItem.taskId }),
      }));

      const response = await batchCreateAsync(
        { cuts },
        {
          file: true,
          task: {
            select: {
              id: true,
              name: true,
              customer: {
                select: {
                  id: true,
                  fantasyName: true,
                },
              },
            },
          },
          parentCut: {
            select: {
              id: true,
              file: true,
            },
          },
        },
      );

      onSuccess?.(response.data?.success ?? []);
      reset();
      onClose();
    } catch (error) {
      console.error('[CutRequestModal] Error:', error);
      // API client already shows error alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  // Get proper filename
  const file = cutItem?.file;
  const fileName = file?.filename || (file?.key as string | undefined) || "arquivo";

  // Reason options for combobox
  const reasonOptions = Object.entries(CUT_REQUEST_REASON_LABELS).map(
    ([value, label]) => ({
      label: label as string,
      value: value as CUT_REQUEST_REASON,
    })
  );

  return (
    <StandardModal
      visible={visible}
      onClose={handleClose}
      title="Solicitar Recorte"
      icon={IconCut}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: handleClose, disabled: isSubmitting },
        {
          label: isSubmitting ? "Solicitando..." : "Solicitar",
          variant: "default",
          onPress: handleSubmit(onSubmit),
          disabled: !isValid || isSubmitting || !cutItem,
          loading: isSubmitting,
        },
      ]}
    >
      {/* File name */}
      {fileName ? (
        <ThemedText style={[styles.fileName, { color: colors.mutedForeground }]} numberOfLines={1}>
          {fileName}
        </ThemedText>
      ) : null}

      {/* Current cut info */}
      {cutItem && (
        <View style={[styles.currentInfo, { backgroundColor: colors.muted }]}>
          <ThemedText style={[styles.currentInfoLabel, { color: colors.mutedForeground }]}>
            Tipo:
          </ThemedText>
          <ThemedText style={styles.currentInfoValue}>
            {CUT_TYPE_LABELS[cutItem.type]}
          </ThemedText>
        </View>
      )}

      {/* Reason and Quantity Row */}
      <View style={styles.formRow}>
        {/* Reason Field - 2/3 width */}
        <View style={styles.reasonField}>
          <ThemedText style={styles.label}>Motivo</ThemedText>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, value } }) => (
              <Combobox
                options={reasonOptions}
                value={value}
                onValueChange={onChange}
                placeholder="Selecione o motivo"
                searchable={false}
                clearable={false}
              />
            )}
          />
          {errors.reason && (
            <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
              {errors.reason.message}
            </ThemedText>
          )}
        </View>

        {/* Quantity Field - 1/3 width */}
        <View style={styles.quantityField}>
          <ThemedText style={styles.label}>Qnt</ThemedText>
          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <Input
                value={value?.toString() || ""}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  onChange(num);
                }}
                keyboardType="numeric"
                placeholder="1"
                error={!!errors.quantity?.message}
              />
            )}
          />
        </View>
      </View>

      {/* Summary - only show when quantity > 1 */}
      {quantity > 1 && (
        <View style={[styles.summary, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.summaryText}>
            Serão criados {quantity} novos cortes
          </ThemedText>
          <ThemedText style={[styles.summarySubtext, { color: colors.mutedForeground }]}>
            Motivo: {CUT_REQUEST_REASON_LABELS[reason]}
          </ThemedText>
        </View>
      )}
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  fileName: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  currentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  currentInfoLabel: {
    fontSize: fontSize.xs,
  },
  currentInfoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  reasonField: {
    flex: 2,
    gap: 6,
  },
  quantityField: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  summary: {
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  summaryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  summarySubtext: {
    fontSize: fontSize.xs,
  },
});
