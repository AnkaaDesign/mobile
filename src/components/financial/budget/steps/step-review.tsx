import { View, StyleSheet } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard } from "@/components/ui/form-section";
import { Combobox } from "@/components/ui/combobox";
import { BudgetPreview } from "@/components/production/task/quote/budget-preview";
import { InvoiceListCard } from "@/components/production/task/billing/invoice-list-card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import {
  TASK_QUOTE_STATUS,
  TASK_QUOTE_STATUS_LABELS,
} from "@/constants";
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
  [TASK_QUOTE_STATUS.COMMERCIAL_APPROVED]: { bg: "#1d4ed8", border: "#1e40af" }, // blue-700
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
  fieldPrefix?: string; // '' for create, 'quote.' for edit
}

export function StepReview({
  mode,
  task,
  existingQuote,
  selectedCustomers,
  layoutFiles,
  canEditStatus = false,
  fieldPrefix = "",
}: StepReviewProps) {
  const { colors } = useTheme();
  const { control, setValue } = useFormContext();

  // Quote status lives at `quote.status` (edit/billing) or `budgetStatus` (create).
  // New budgets are always PENDING at creation time, so we never expose editing in create mode.
  const statusFieldName = fieldPrefix ? `${fieldPrefix}status` : "budgetStatus";
  const watchedStatus = useWatch({ control, name: statusFieldName }) as
    | TASK_QUOTE_STATUS
    | undefined;
  const currentStatus: TASK_QUOTE_STATUS =
    watchedStatus || TASK_QUOTE_STATUS.PENDING;
  const statusEditable = mode !== "create" && canEditStatus;

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
            if (next) setValue(statusFieldName, next as TASK_QUOTE_STATUS);
          }}
          options={STATUS_OPTIONS}
          getOptionValue={(o) => o.value}
          getOptionLabel={(o) => o.label}
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
});
