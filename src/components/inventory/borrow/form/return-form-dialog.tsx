import { useState } from "react";
import { View, StyleSheet, Modal, ScrollView, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ThemedText,
  Card,
  Button,
  Textarea,
  Label,
  Combobox,
} from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconLoader, IconX, IconPackageImport, IconCheck } from "@tabler/icons-react-native";
import { formatDate } from "@/utils";
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
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <IconPackageImport size={24} color={colors.foreground} />
              <View style={styles.headerText}>
                <ThemedText style={styles.title}>Registrar Devolução</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Registre os detalhes da devolução do item emprestado
                </ThemedText>
              </View>
            </View>
            <Button
              variant="ghost"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.closeButton}
            >
              <IconX size={24} color={colors.foreground} />
            </Button>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Item Information */}
            <Card style={styles.infoCard}>
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
                    {borrow.quantity}
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
            <Card style={styles.formCard}>
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
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <Button
              variant="outline"
              onPress={handleClose}
              disabled={isSubmitting}
              style={styles.footerButton}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>

            <Button
              variant="default"
              onPress={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
              style={styles.footerButton}
            >
              {isSubmitting ? (
                <>
                  <IconLoader size={20} color="white" />
                  <ThemedText style={{ color: "white" }}>Processando...</ThemedText>
                </>
              ) : (
                <>
                  <IconCheck size={20} />
                  <ThemedText style={{ color: "white" }}>Confirmar Devolução</ThemedText>
                </>
              )}
            </Button>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: fontSize.sm,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
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
  formCard: {
    marginBottom: spacing.lg,
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
  footer: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
});
