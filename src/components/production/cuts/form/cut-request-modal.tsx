import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Modal, ActivityIndicator, Alert } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { formSpacing, formLayout } from "@/constants/form-styles";
import {
  CUT_REQUEST_REASON,
  CUT_ORIGIN,
  CUT_REQUEST_REASON_LABELS,
  CUT_TYPE_LABELS,
} from "@/constants";
import { useCutBatchMutations } from "@/hooks";
// import { showToast } from "@/components/ui/toast";
import { FileItem, useFileViewer } from "@/components/file";
import type { Cut } from "@/types";
import {
  IconCut,
  IconX,
  IconCheck,
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
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { batchCreateAsync } = useCutBatchMutations();
  const { actions: fileViewerActions } = useFileViewer();

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
      notes: "",
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
    console.log('[CutRequestModal] onSubmit called with data:', data);

    if (!cutItem) {
      console.log('[CutRequestModal] No cutItem, showing error');
      Alert.alert("Erro", "Nenhum corte selecionado");
      return;
    }

    console.log('[CutRequestModal] cutItem:', cutItem);
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

      console.log('[CutRequestModal] Creating cuts:', cuts);

      const response = await batchCreateAsync(
        { cuts },
        {
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
      );

      console.log('[CutRequestModal] Response:', response);

      // API client already shows success alert

      onSuccess?.(response.data.success);
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

  // Get proper filename - try multiple possible fields
  const file = cutItem?.file;
  const fileName = file?.filename || file?.key || "arquivo";
  const taskName = cutItem?.task?.name;
  const customerName = cutItem?.task?.customer?.name;

  // Handle file press to open viewer modal
  const handleFilePress = () => {
    if (file) {
      fileViewerActions.viewFile(file);
    }
  };

  // Reason options for combobox
  const reasonOptions = Object.entries(CUT_REQUEST_REASON_LABELS).map(
    ([value, label]) => ({
      label: label as string,
      value: value as CUT_REQUEST_REASON,
    })
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Drag Indicator */}
        <View style={styles.dragIndicatorContainer}>
          <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <IconCut size={20} color={colors.primary} />
              <ThemedText style={styles.headerTitle}>Solicitar Novo Corte</ThemedText>
            </View>
            {cutItem && (
              <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                {fileName}
              </ThemedText>
            )}
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.muted }]}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <IconX size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* File Preview - Click to open full viewer */}
            {file && (
              <View style={styles.filePreviewContainer}>
                <View style={styles.filePreviewRow}>
                  <FileItem
                    file={file}
                    viewMode="grid"
                    onPress={handleFilePress}
                    showFilename={false}
                    showFileSize={false}
                  />
                  <View style={styles.fileInfoContainer}>
                    <Badge variant="outline" style={styles.typeBadge}>
                      {CUT_TYPE_LABELS[cutItem!.type]}
                    </Badge>
                    {taskName && (
                      <ThemedText style={[styles.taskInfo, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {taskName}
                        {customerName && ` - ${customerName}`}
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>
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
                <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                  {errors.quantity.message}
                </ThemedText>
              )}
            </View>

            {/* Reason Field - Using Combobox like web version */}
            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Motivo da Solicitação</ThemedText>
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

            {/* Summary - only show when quantity > 1 */}
            {quantity > 1 && (
              <Card style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
                <CardContent style={styles.summaryContent}>
                  <ThemedText style={styles.summaryTitle}>
                    Serão criados {quantity} novos cortes
                  </ThemedText>
                  <ThemedText style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
                    Motivo: {CUT_REQUEST_REASON_LABELS[reason]}
                  </ThemedText>
                </CardContent>
              </Card>
            )}
          </ScrollView>

          {/* Footer - SimpleFormActionBar style */}
          <View
            style={[
              styles.actionBar,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
                marginBottom: insets.bottom + formSpacing.cardMarginBottom,
              },
            ]}
          >
            <View style={styles.buttonWrapper}>
              <Button
                variant="outline"
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <IconX size={18} color={colors.mutedForeground} />
                <Text style={styles.buttonText}>Cancelar</Text>
              </Button>
            </View>

            <View style={styles.buttonWrapper}>
              <Button
                variant="default"
                onPress={handleSubmit(onSubmit, (errors) => {
                  console.log('[CutRequestModal] Validation errors:', errors);
                })}
                disabled={!isValid || isSubmitting || !cutItem}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <IconCheck size={18} color={colors.primaryForeground} />
                )}
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                  {isSubmitting ? "Solicitando..." : "Solicitar"}
                </Text>
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragIndicatorContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: "80%",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  filePreviewContainer: {
    marginBottom: spacing.sm,
  },
  filePreviewRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  fileInfoContainer: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
  },
  typeBadge: {
    alignSelf: "flex-start",
  },
  taskInfo: {
    fontSize: fontSize.sm,
  },
  formGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  summaryCard: {
    padding: 0,
    borderRadius: 12,
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
  // ActionBar styles - matching SimpleFormActionBar
  actionBar: {
    flexDirection: "row",
    gap: formSpacing.rowGap,
    padding: formSpacing.actionBarPadding,
    borderRadius: formLayout.cardBorderRadius,
    borderWidth: formLayout.borderWidth,
    marginHorizontal: formSpacing.containerPaddingHorizontal,
    marginTop: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
