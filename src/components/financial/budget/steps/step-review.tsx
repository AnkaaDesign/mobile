import { View, StyleSheet } from "react-native";
import { useFormContext, useWatch } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { FormCard } from "@/components/ui/form-section";
import { BudgetPreview } from "@/components/production/task/quote/budget-preview";
import { InvoiceListCard } from "@/components/production/task/billing/invoice-list-card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import type { FilePickerItem } from "@/components/ui/file-picker";

interface StepReviewProps {
  mode: "create" | "edit" | "billing";
  task?: any;
  existingQuote?: any;
  selectedCustomers: Map<string, any>;
  layoutFiles: FilePickerItem[];
  fieldPrefix?: string; // '' for create, 'quote.' for edit
}

export function StepReview({
  mode,
  task,
  existingQuote,
  selectedCustomers,
  layoutFiles,
  fieldPrefix = "",
}: StepReviewProps) {
  const { colors } = useTheme();
  const { control } = useFormContext();

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

  const subtitle =
    mode === "edit" || mode === "billing"
      ? "Revise antes de salvar"
      : "Revise antes de criar";

  return (
    <View style={styles.container}>
      <FormCard title="Resumo" icon="IconClipboardCheck" subtitle={subtitle}>
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
                  Nos de Serie
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
