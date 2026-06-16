import { useMemo, useState } from "react";
import { View, StyleSheet, Modal, TextInput, TouchableOpacity } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard } from "@/components/ui/form-section";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { BudgetPreview } from "@/components/production/task/quote/budget-preview";
import { InvoiceListCard } from "@/components/production/task/billing/invoice-list-card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  TASK_QUOTE_STATUS,
  TASK_QUOTE_STATUS_LABELS,
} from "@/constants";
import {
  canUpdateQuoteStatus,
  getAvailableQuoteStatusTransitions,
} from "@/utils/permissions/quote-permissions";
import type { TASK_QUOTE_STATUS as TaskQuoteStatusType } from "@/types/task-quote";
import type { FilePickerItem } from "@/components/ui/file-picker";

interface StatusOption {
  value: TASK_QUOTE_STATUS;
  label: string;
}

const STATUS_OPTIONS: StatusOption[] = Object.values(TASK_QUOTE_STATUS).map(
  (value) => ({
    value,
    label: TASK_QUOTE_STATUS_LABELS[value],
  }),
);

// Solid status colors — used to paint the whole Combobox trigger, mirroring
// the service-order status control on the task detail page.
const STATUS_TRIGGER_COLORS: Record<TASK_QUOTE_STATUS, { bg: string; border: string }> = {
  [TASK_QUOTE_STATUS.PENDING]: { bg: "#737373", border: "#525252" },            // neutral-500
  [TASK_QUOTE_STATUS.BUDGET_APPROVED]: { bg: "#15803d", border: "#166534" },    // green-700
  [TASK_QUOTE_STATUS.BILLING_APPROVED]: { bg: "#15803d", border: "#166534" },   // green-700
  [TASK_QUOTE_STATUS.UPCOMING]: { bg: "#d97706", border: "#b45309" },           // amber-600
  [TASK_QUOTE_STATUS.DUE]: { bg: "#b91c1c", border: "#991b1b" },                // red-700
  [TASK_QUOTE_STATUS.PARTIAL]: { bg: "#1d4ed8", border: "#1e40af" },            // blue-700
  [TASK_QUOTE_STATUS.SETTLED]: { bg: "#15803d", border: "#166534" },            // green-700
};

interface StepReviewProps {
  mode: "create" | "edit" | "billing";
  task?: any;
  existingQuote?: any;
  selectedCustomers: Map<string, any>;
  layoutFiles: FilePickerItem[];
  /** When true, render the status as an editable combobox. Otherwise, read-only badge. */
  canEditStatus?: boolean;
  /** User sector privilege — drives allowed status transitions. */
  userRole?: string;
  fieldPrefix?: string; // '' for create, 'quote.' for edit
}

export function StepReview({
  mode,
  task,
  existingQuote,
  selectedCustomers,
  layoutFiles,
  canEditStatus = false,
  userRole = "",
  fieldPrefix = "",
}: StepReviewProps) {
  const { colors } = useTheme();
  const { control, setValue } = useFormContext();

  // Reject-reason capture: required when stepping a quote back to PENDING.
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingRejectStatus, setPendingRejectStatus] = useState<string | null>(null);

  // Quote status lives at `quote.status` (edit/billing) or `budgetStatus` (create).
  // New budgets are always PENDING at creation time, so we never expose editing in create mode.
  const statusFieldName = fieldPrefix ? `${fieldPrefix}status` : "budgetStatus";
  const watchedStatus = useWatch({ control, name: statusFieldName }) as
    | TASK_QUOTE_STATUS
    | undefined;
  const currentStatus: TASK_QUOTE_STATUS =
    watchedStatus || TASK_QUOTE_STATUS.PENDING;
  // Editable only outside create mode, when the caller allows it, AND the user
  // role is permitted to update status.
  const statusEditable =
    mode !== "create" && canEditStatus && canUpdateQuoteStatus(userRole);

  // Allowed next statuses for the current state + role. The current status is
  // always shown (selected) but disabled; everything else is gated.
  const allowedNextStatuses = useMemo(
    () =>
      getAvailableQuoteStatusTransitions(
        currentStatus as TaskQuoteStatusType,
        userRole,
      ),
    [currentStatus, userRole],
  );

  // Apply a status transition, capturing a reason when reverting to PENDING.
  const applyStatusChange = (next: string) => {
    if (!next || next === currentStatus) return;
    if (next === TASK_QUOTE_STATUS.PENDING && currentStatus !== TASK_QUOTE_STATUS.PENDING) {
      setPendingRejectStatus(next);
      setRejectReason("");
      setRejectModalOpen(true);
      return;
    }
    setValue(statusFieldName, next as TASK_QUOTE_STATUS, { shouldDirty: true });
  };

  // Watch all quote-related form values
  const formQuoteValues = useWatch({
    control,
    name: fieldPrefix ? fieldPrefix.replace(/\.$/, "") : "",
  });

  // In create mode, watch task-level fields for the summary
  const taskName = useWatch({ control, name: "name" });
  const plates = useWatch({ control, name: "plates" });
  const serialNumbers = useWatch({ control, name: "serialNumbers" });

  // Build layout file for preview
  const layoutFileForPreview = (() => {
    if (layoutFiles.length > 0) {
      const pickedFile = layoutFiles[0];
      return pickedFile.uploaded && pickedFile.id
        ? { id: pickedFile.id }
        : { uri: pickedFile.uri };
    }
    const layoutFileId = formQuoteValues?.layoutFileId;
    if (layoutFileId) {
      return { id: layoutFileId };
    }
    if (existingQuote?.layoutFile) {
      return existingQuote.layoutFile;
    }
    return null;
  })();

  // Build the quote data object for BudgetPreview
  const quoteData = formQuoteValues
    ? {
        ...formQuoteValues,
        services: formQuoteValues.services ? [...formQuoteValues.services] : [],
        budgetNumber: existingQuote?.budgetNumber,
        createdAt: existingQuote?.createdAt || new Date(),
        layoutFile: layoutFileForPreview,
      }
    : null;

  // Map BudgetPreview mode prop
  const previewMode = mode === "billing" ? "billing" : "budget";

  return (
    <View style={styles.container}>
      {/* Status card — full-width solid-color combobox matching the service
          order status control on the task detail page. The trigger IS the
          status display; options in the dropdown render as pill badges. */}
      <FormCard title="Status" icon="IconFlag">
        <Combobox<StatusOption>
          value={currentStatus}
          onValueChange={(value) => {
            if (!statusEditable) return;
            const next = typeof value === "string" ? value : "";
            if (next) applyStatusChange(next);
          }}
          options={STATUS_OPTIONS}
          getOptionValue={(o) => o.value}
          getOptionLabel={(o) => o.label}
          isOptionDisabled={(o) =>
            o.value !== currentStatus &&
            !allowedNextStatuses.includes(o.value as TaskQuoteStatusType)
          }
          triggerStyle={{
            backgroundColor: STATUS_TRIGGER_COLORS[currentStatus].bg,
            borderColor: STATUS_TRIGGER_COLORS[currentStatus].border,
            textColor: "#ffffff",
          }}
          placeholder="Selecione o status"
          searchable={false}
          clearable={false}
          disabled={!statusEditable}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      </FormCard>

      <FormCard title="Resumo" icon="IconClipboardCheck">
        {/* Task summary - create mode only */}
        {mode === "create" && (
          <View style={styles.taskSummary}>
            {taskName ? (
              <View style={styles.summaryRow}>
                <ThemedText
                  style={[styles.summaryLabel, { color: colors.mutedForeground }]}
                >
                  Nome
                </ThemedText>
                <ThemedText style={styles.summaryValue}>{taskName}</ThemedText>
              </View>
            ) : null}
            {plates?.length ? (
              <View style={styles.summaryRow}>
                <ThemedText
                  style={[styles.summaryLabel, { color: colors.mutedForeground }]}
                >
                  Placas
                </ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {plates.join(", ")}
                </ThemedText>
              </View>
            ) : null}
            {serialNumbers?.length ? (
              <View style={styles.summaryRow}>
                <ThemedText
                  style={[styles.summaryLabel, { color: colors.mutedForeground }]}
                >
                  Nºs de Série
                </ThemedText>
                <ThemedText style={styles.summaryValue}>
                  {serialNumbers.join(", ")}
                </ThemedText>
              </View>
            ) : null}
          </View>
        )}

        {/* Budget / billing preview */}
        {quoteData && (
          <BudgetPreview
            mode={previewMode}
            quote={quoteData as any}
            task={
              task
                ? {
                    name: task.name,
                    serialNumber: task.serialNumber ?? undefined,
                    term: task.term,
                    customer: task.customer
                      ? {
                          corporateName: task.customer.corporateName ?? undefined,
                          fantasyName: task.customer.fantasyName ?? undefined,
                        }
                      : undefined,
                    responsibles: task.responsibles,
                  }
                : undefined
            }
            selectedCustomers={selectedCustomers}
          />
        )}
      </FormCard>

      {/* Invoice list - billing mode only */}
      {mode === "billing" && task?.id && (
        <InvoiceListCard taskId={task.id} />
      )}

      {/* Reject-reason modal — required when reverting to PENDING. The reason is
          written to the form ("statusReason"). NOTE: the API does not currently
          accept a reason on the status-update path, so this is captured UI-side
          only until the backend supports it. */}
      <Modal
        transparent
        animationType="fade"
        visible={rejectModalOpen}
        onRequestClose={() => setRejectModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.popover, borderColor: colors.border },
            ]}
          >
            <ThemedText style={styles.modalTitle}>Rejeitar Orçamento</ThemedText>
            <ThemedText style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              Informe o motivo da rejeição. O status do orçamento voltará para Pendente.
            </ThemedText>
            <ThemedText style={[styles.modalLabel, { color: colors.foreground }]}>
              Motivo da rejeição *
            </ThemedText>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Descreva o motivo (mínimo 5 caracteres)..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.modalTextArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  setRejectModalOpen(false);
                  setPendingRejectStatus(null);
                  setRejectReason("");
                }}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={rejectReason.trim().length < 5}
                onPress={() => {
                  if (rejectReason.trim().length < 5 || !pendingRejectStatus) return;
                  setValue(
                    fieldPrefix ? `${fieldPrefix}statusReason` : "statusReason",
                    rejectReason.trim(),
                    { shouldDirty: true },
                  );
                  setValue(
                    statusFieldName,
                    pendingRejectStatus as TASK_QUOTE_STATUS,
                    { shouldDirty: true },
                  );
                  setRejectModalOpen(false);
                  setPendingRejectStatus(null);
                  setRejectReason("");
                }}
              >
                Confirmar Rejeição
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  taskSummary: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.sm,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  // Reject-reason modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  modalLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    minHeight: 90,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
