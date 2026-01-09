import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { FormFieldGroup } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { IconFileText, IconCopy } from "@tabler/icons-react-native";
import { CustomerSelector } from "./customer-selector";
import { TaskNameAutocomplete } from "./task-name-autocomplete";
import { PlateTagsInput } from "./plate-tags-input";
import { SerialNumberRangeInput } from "./serial-number-range-input";
import { TASK_STATUS } from "@/constants/enums";

// Simplified schema matching web simple-task-create-dialog.tsx with badge inputs
const simpleTaskSchema = z.object({
  name: z.string().optional(), // Name is not required
  customerId: z.string().uuid().nullable().optional(),
  plates: z.array(z.string()).optional(), // Array of plates
  serialNumbers: z.array(z.number()).optional(), // Array of serial numbers
});

type SimpleTaskFormData = z.infer<typeof simpleTaskSchema>;

interface SimpleTaskCreateFormProps {
  onSubmit: (data: SimpleTaskFormData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function SimpleTaskCreateForm({ onSubmit, onCancel, isSubmitting }: SimpleTaskCreateFormProps) {
  const { colors } = useTheme();

  // Keyboard-aware scrolling
  const { handlers, refs } = useKeyboardAwareScroll();

  // Memoize keyboard context value
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(
    () => ({
      onFieldLayout: handlers.handleFieldLayout,
      onFieldFocus: handlers.handleFieldFocus,
      onComboboxOpen: handlers.handleComboboxOpen,
      onComboboxClose: handlers.handleComboboxClose,
    }),
    [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]
  );

  const form = useForm<SimpleTaskFormData>({
    resolver: zodResolver(simpleTaskSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      customerId: null,
      plates: [],
      serialNumbers: [],
    },
  });

  // Watch badge arrays to show task count preview
  const plates = form.watch("plates") || [];
  const serialNumbers = form.watch("serialNumbers") || [];

  // Calculate expected task count based on combinations
  const calculateTaskCount = () => {
    const plateCount = plates.length || 1; // If no plates, still create 1 task
    const serialCount = serialNumbers.length || 1; // If no serial numbers, still create 1 task

    // If both are specified, create combination
    if (plates.length > 0 && serialNumbers.length > 0) {
      return plateCount * serialCount;
    }

    // If only one is specified
    return Math.max(plateCount, serialCount);
  };

  const expectedTaskCount = calculateTaskCount();

  const handleSubmit = useCallback(
    async (data: SimpleTaskFormData) => {
      try {
        // Build payload matching web format
        const payload: any = {
          status: TASK_STATUS.PREPARATION,
        };

        // Add name if provided
        if (data.name && data.name.trim().length > 0) {
          payload.name = data.name.trim();
        }

        // Add customer if provided
        if (data.customerId) {
          payload.customerId = data.customerId;
        }

        // Add plates array if provided
        if (data.plates && data.plates.length > 0) {
          payload.plates = data.plates;
        }

        // Add serial numbers array if provided
        if (data.serialNumbers && data.serialNumbers.length > 0) {
          payload.serialNumbers = data.serialNumbers;
        }

        await onSubmit(payload);
      } catch (error) {
        console.error("Error submitting task:", error);
      }
    },
    [onSubmit]
  );

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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            <Card style={styles.card}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <IconFileText size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Informações da Tarefa</ThemedText>
                </View>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {/* Task Name with Autocomplete - Not Required */}
                <TaskNameAutocomplete control={form.control} disabled={isSubmitting} />

                {/* Customer */}
                <FormFieldGroup label="Cliente" error={form.formState.errors.customerId?.message}>
                  <Controller
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <CustomerSelector
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </FormFieldGroup>

                {/* Plates - Badge Input (Full Width) */}
                <PlateTagsInput control={form.control} disabled={isSubmitting} />

                {/* Serial Numbers - Badge Input (Full Width) */}
                <SerialNumberRangeInput control={form.control} disabled={isSubmitting} />

                {/* Task Count Preview */}
                {expectedTaskCount > 1 && (
                  <View style={[styles.taskCountPreview, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                    <IconCopy size={16} color={colors.primary} />
                    <ThemedText style={[styles.taskCountPreviewText, { color: colors.primary }]}>
                      {expectedTaskCount} tarefa{expectedTaskCount > 1 ? "s" : ""} será{expectedTaskCount > 1 ? "ão" : ""} criada{expectedTaskCount > 1 ? "s" : ""}
                    </ThemedText>
                  </View>
                )}
              </View>
            </Card>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={onCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isSubmitting}
          canSubmit={form.formState.isValid}
          submitLabel={expectedTaskCount > 1 ? `Criar ${expectedTaskCount} Tarefa${expectedTaskCount > 1 ? "s" : ""}` : "Criar Tarefa"}
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
    paddingBottom: 0,
  },
  card: {
    padding: 16, // spacing.md
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16, // spacing.md
    paddingBottom: 8, // spacing.sm
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // spacing.sm
  },
  sectionTitle: {
    fontSize: 16, // fontSize.base
    fontWeight: "600" as any, // fontWeight.semibold
  },
  content: {
    gap: 16, // spacing.md
  },
  taskCountPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // spacing.sm
    padding: 12, // spacing.md
    borderRadius: 8, // borderRadius.md
    borderWidth: 1,
  },
  taskCountPreviewText: {
    fontSize: 14, // fontSize.sm
    fontWeight: "600" as any, // fontWeight.semibold
  },
});
