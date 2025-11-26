import { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import {
  CUT_REQUEST_REASON,
  CUT_ORIGIN,
  CUT_REQUEST_REASON_LABELS,
  CUT_TYPE_LABELS,
  CUT_STATUS_LABELS,
} from "@/constants";
import { useCutMutations } from "@/hooks";
import { showToast } from "@/components/ui/toast";
import { formatDate } from "@/utils";
import type { Cut } from "@/types";
import {
  IconFileText,
  IconScissors,
  IconInfoCircle,
  IconAlertCircle,
  IconX,
} from "@tabler/icons-react-native";

const requestSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantidade deve ser um número inteiro")
    .min(1, "Quantidade deve ser maior que zero")
    .max(100, "Quantidade não pode exceder 100"),
  reason: z.nativeEnum(CUT_REQUEST_REASON, {
    errorMap: () => ({ message: "Motivo inválido" }),
  }),
  notes: z.string().optional(),
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
  const { batchCreate } = useCutMutations();

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      quantity: 1,
      reason: CUT_REQUEST_REASON.WRONG_APPLY,
      notes: "",
    },
    mode: "onChange",
  });

  const quantity = watch("quantity");
  const reason = watch("reason");

  const onSubmit = async (data: RequestFormData) => {
    if (!cutItem) {
      showToast({
        message: "Nenhum corte selecionado",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { quantity, notes, ...requestData } = data;

      // Create multiple new cuts based on the original cut
      const cuts = Array.from({ length: quantity }, () => ({
        fileId: cutItem.fileId,
        type: cutItem.type,
        origin: CUT_ORIGIN.REQUEST,
        reason: requestData.reason,
        parentCutId: cutItem.id,
        ...(cutItem.taskId && { taskId: cutItem.taskId }),
      }));

      const response = await batchCreate.mutateAsync({
        data: { cuts },
        include: {
          file: true,
          task: {
            include: {
              customer: true,
            },
          },
          parentCut: {
            include: {
              file: true,
            },
          },
        },
      });

      showToast({
        message: `${quantity} novo(s) corte(s) solicitado(s) com sucesso`,
        type: "success",
      });

      onSuccess?.(response.data.success);
      reset();
      onClose();
    } catch (error) {
      showToast({
        message: "Erro ao solicitar novos cortes",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const fileName = cutItem?.file?.filename || "arquivo";
  const taskName = cutItem?.task?.name;
  const customerName = cutItem?.task?.customer?.name;

  const reasonOptions = Object.entries(CUT_REQUEST_REASON_LABELS).map(
    ([value, label]) => ({
      label: label as string,
      value: value as CUT_REQUEST_REASON,
    })
  );

  return (
    <Modal visible={visible} onClose={handleClose} animationType="slide">
      <View
        style={StyleSheet.flatten([
          styles.container,
          { backgroundColor: colors.background },
        ])}
      >
        {/* Header */}
        <View
          style={StyleSheet.flatten([
            styles.header,
            { borderBottomColor: colors.border },
          ])}
        >
          <View style={styles.headerLeft}>
            <IconScissors size={24} color={colors.primary} />
            <ThemedText style={styles.headerTitle}>
              Solicitar Novo Corte
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isSubmitting}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <IconX size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

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
            onLayout={handlers.handleScrollViewLayout}
            onScroll={handlers.handleScroll}
            scrollEventThrottle={16}
          >
            <KeyboardAwareFormProvider value={keyboardContextValue}>
          {/* Cut Information Card */}
          {cutItem && (
            <Card style={styles.card}>
              <CardContent style={styles.cutInfo}>
                <View style={styles.cutInfoRow}>
                  <View style={styles.cutInfoLeft}>
                    <IconFileText size={16} color={colors.mutedForeground} />
                    <ThemedText
                      style={styles.fileName}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {fileName}
                    </ThemedText>
                  </View>
                  <View style={styles.badgeRow}>
                    <Badge variant="outline">
                      {CUT_TYPE_LABELS[cutItem.type]}
                    </Badge>
                    <Badge variant="secondary">
                      {CUT_STATUS_LABELS[cutItem.status]}
                    </Badge>
                  </View>
                </View>

                {taskName && (
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.taskInfo,
                      { color: colors.mutedForeground },
                    ])}
                  >
                    <ThemedText style={styles.taskInfoLabel}>
                      Tarefa:
                    </ThemedText>{" "}
                    {taskName}
                    {customerName && ` - ${customerName}`}
                  </ThemedText>
                )}

                <View style={styles.datesInfo}>
                  <ThemedText
                    style={StyleSheet.flatten([
                      styles.dateText,
                      { color: colors.mutedForeground },
                    ])}
                  >
                    Criado em: {formatDate(cutItem.createdAt)}
                  </ThemedText>
                  {cutItem.startedAt && (
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.dateText,
                        { color: colors.mutedForeground },
                      ])}
                    >
                      Iniciado em: {formatDate(cutItem.startedAt)}
                    </ThemedText>
                  )}
                  {cutItem.completedAt && (
                    <ThemedText
                      style={StyleSheet.flatten([
                        styles.dateText,
                        { color: colors.mutedForeground },
                      ])}
                    >
                      Concluído em: {formatDate(cutItem.completedAt)}
                    </ThemedText>
                  )}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Quantity Field */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>
              Quantidade de Novos Cortes
            </ThemedText>
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
                  error={errors.quantity?.message}
                />
              )}
            />
            {errors.quantity && (
              <ThemedText
                style={StyleSheet.flatten([
                  styles.errorText,
                  { color: colors.destructive },
                ])}
              >
                {errors.quantity.message}
              </ThemedText>
            )}
          </View>

          {/* Reason Field */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Motivo da Solicitação</ThemedText>
            <Controller
              control={control}
              name="reason"
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onValueChange={onChange}
                  options={reasonOptions}
                  placeholder="Selecione o motivo"
                />
              )}
            />
            {errors.reason && (
              <ThemedText
                style={StyleSheet.flatten([
                  styles.errorText,
                  { color: colors.destructive },
                ])}
              >
                {errors.reason.message}
              </ThemedText>
            )}
          </View>

          {/* Notes Field */}
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>
              Observações (Opcional)
            </ThemedText>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  value={value || ""}
                  onChangeText={onChange}
                  placeholder="Adicione detalhes sobre a solicitação..."
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 80 }}
                />
              )}
            />
          </View>

          {/* Info Alert */}
          <Card
            style={StyleSheet.flatten([
              styles.infoAlert,
              {
                backgroundColor: colors.info + "15",
                borderColor: colors.info,
              },
            ])}
          >
            <CardContent style={styles.alertContent}>
              <IconInfoCircle size={20} color={colors.info} />
              <ThemedText
                style={StyleSheet.flatten([
                  styles.alertText,
                  { color: colors.info },
                ])}
              >
                Os novos cortes serão criados com status "Pendente" e marcados
                como retrabalho do corte original.
              </ThemedText>
            </CardContent>
          </Card>

          {/* Summary */}
          {quantity > 1 && (
            <Card
              style={StyleSheet.flatten([
                styles.summaryCard,
                { backgroundColor: colors.muted },
              ])}
            >
              <CardContent style={styles.summaryContent}>
                <ThemedText style={styles.summaryTitle}>
                  Serão criados {quantity} novos cortes
                </ThemedText>
                <ThemedText
                  style={StyleSheet.flatten([
                    styles.summarySubtitle,
                    { color: colors.mutedForeground },
                  ])}
                >
                  Motivo: {CUT_REQUEST_REASON_LABELS[reason]}
                </ThemedText>
              </CardContent>
            </Card>
          )}

          <View style={{ height: spacing.xl }} />
            </KeyboardAwareFormProvider>
          </ScrollView>

          {/* Footer Buttons */}
        <View
          style={StyleSheet.flatten([
            styles.footer,
            { borderTopColor: colors.border },
          ])}
        >
          <Button
            variant="outline"
            onPress={handleClose}
            disabled={isSubmitting}
            style={{ flex: 1 }}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting || !cutItem}
            loading={isSubmitting}
            style={{ flex: 1 }}
          >
            {isSubmitting ? "Solicitando..." : "Solicitar"}
          </Button>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 0,
  },
  card: {
    padding: 0,
  },
  cutInfo: {
    gap: spacing.sm,
  },
  cutInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  cutInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  fileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexShrink: 0,
  },
  taskInfo: {
    fontSize: fontSize.sm,
  },
  taskInfoLabel: {
    fontWeight: fontWeight.medium,
  },
  datesInfo: {
    gap: 4,
  },
  dateText: {
    fontSize: fontSize.xs,
  },
  formGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  infoAlert: {
    borderWidth: 1,
  },
  alertContent: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  alertText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  summaryCard: {
    padding: 0,
  },
  summaryContent: {
    gap: 4,
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  summarySubtitle: {
    fontSize: fontSize.xs,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
  },
});
