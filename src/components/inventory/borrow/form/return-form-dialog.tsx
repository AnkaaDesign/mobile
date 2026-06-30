import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ThemedText,
  Card,
  Textarea,
  Label,
  Combobox,
  StandardModal,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconPackageImport } from "@tabler/icons-react-native";
import { formatDate, formatQuantity } from "@/utils";
import type { Borrow } from "@/types";

// Define return condition enum
enum RETURN_CONDITION {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  DAMAGED = "DAMAGED",
}

// Labels for return conditions
const RETURN_CONDITION_LABELS: Record<RETURN_CONDITION, string> = {
  [RETURN_CONDITION.EXCELLENT]: "Excelente",
  [RETURN_CONDITION.GOOD]: "Bom",
  [RETURN_CONDITION.FAIR]: "Regular",
  [RETURN_CONDITION.POOR]: "Ruim",
  [RETURN_CONDITION.DAMAGED]: "Danificado",
};

// Define the return form schema
const returnFormSchema = z.object({
  condition: z.enum(Object.values(RETURN_CONDITION) as [string, ...string[]], {
    required_error: "Condição é obrigatória",
  }),
  notes: z.string().max(500, "Notas devem ter no máximo 500 caracteres").optional(),
  returnedAt: z.date().default(() => new Date()),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrow: Borrow & {
    item?: {
      name: string;
      barcode?: string | null;
    };
    user?: {
      name: string;
      email: string;
    };
  };
  onSubmit: (data: ReturnFormData) => Promise<void>;
}

export function ReturnFormDialog({ open, onOpenChange, borrow, onSubmit }: ReturnFormDialogProps) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      condition: RETURN_CONDITION.GOOD,
      notes: "",
      returnedAt: new Date(),
    },
  });

  const handleSubmit = async (data: ReturnFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);

      // Reset form and close
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing return:", error);
      Alert.alert(
        "Erro ao processar devolução",
        "Ocorreu um erro ao registrar a devolução. Tente novamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    onOpenChange(false);
  };

  const conditionOptions = Object.entries(RETURN_CONDITION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <StandardModal
      visible={open}
      onClose={handleClose}
      title="Registrar Devolução"
      subtitle="Registre os detalhes da devolução do item emprestado"
      icon={IconPackageImport}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: handleClose, disabled: isSubmitting },
        {
          label: "Confirmar Devolução",
          onPress: form.handleSubmit(handleSubmit),
          disabled: isSubmitting,
          loading: isSubmitting,
        },
      ]}
    >
      {/* Item Information */}
      <Card>
        <View style={styles.infoContent}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Item:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {borrow.item?.name}
            </ThemedText>
          </View>

          {borrow.item?.barcode && (
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Código:
              </ThemedText>
              <ThemedText style={styles.infoValue}>
                {borrow.item.barcode}
              </ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Quantidade:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatQuantity(borrow.quantity)}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Emprestado para:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {borrow.user?.name}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Data do empréstimo:
            </ThemedText>
            <ThemedText style={styles.infoValue}>
              {formatDate(borrow.createdAt)}
            </ThemedText>
          </View>
        </View>
      </Card>

      {/* Form */}
      <Card>
        <View style={styles.formContent}>
          {/* Condition Select */}
          <View style={styles.fieldGroup}>
            <Label>Condição do Item *</Label>
            <Controller
              control={form.control}
              name="condition"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Combobox
                    value={value}
                    onValueChange={onChange}
                    options={conditionOptions}
                    placeholder="Selecione a condição"
                    emptyText="Nenhuma condição disponível"
                    disabled={isSubmitting}
                    searchable={false}
                    clearable={false}
                  />
                  {error && (
                    <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                      {error.message}
                    </ThemedText>
                  )}
                </View>
              )}
            />
            <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
              Informe a condição em que o item está sendo devolvido
            </ThemedText>
          </View>

          {/* Notes Textarea */}
          <View style={styles.fieldGroup}>
            <Label>Observações (opcional)</Label>
            <Controller
              control={form.control}
              name="notes"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <View>
                  <Textarea
                    value={value || ""}
                    onChangeText={onChange}
                    placeholder="Adicione observações sobre a devolução..."
                    editable={!isSubmitting}
                    maxLength={500}
                    numberOfLines={4}
                  />
                  {error && (
                    <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
                      {error.message}
                    </ThemedText>
                  )}
                </View>
              )}
            />
            <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
              Registre qualquer observação relevante sobre o estado do item ou a devolução
            </ThemedText>
          </View>
        </View>
      </Card>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  infoContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    textAlign: "right",
  },
  formContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    lineHeight: fontSize.xs * 1.5,
  },
});
