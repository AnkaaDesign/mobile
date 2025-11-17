import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useFieldArray, useWatch } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius, fontWeight } from "@/constants/design-system";
import { IconTrash, IconCalendar, IconFileText, IconCurrencyReal } from "@tabler/icons-react-native";
import { formatCurrency } from "@/utils";

interface BudgetSelectorProps {
  control: any;
  disabled?: boolean;
  onBudgetCountChange?: (count: number) => void;
}

export interface BudgetSelectorRef {
  addBudget: () => void;
}

export const BudgetSelector = forwardRef<BudgetSelectorRef, BudgetSelectorProps>(
  ({ control, disabled, onBudgetCountChange }, ref) => {
    const { colors } = useTheme();
    const [initialized, setInitialized] = useState(false);
    const lastRowRef = useRef<View>(null);

    const { fields, append, remove } = useFieldArray({
      control,
      name: "budget.items",
    });

    // Watch budget values to check for incomplete entries and calculate total
    const budgetItems = useWatch({
      control,
      name: "budget.items",
    });

    const budgetExpiresIn = useWatch({
      control,
      name: "budget.expiresIn",
    });

    // Calculate total from all budget items
    const calculatedTotal = useMemo(() => {
      if (!budgetItems || budgetItems.length === 0) return 0;
      return budgetItems.reduce((sum: number, item: any) => {
        const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
        return sum + amount;
      }, 0);
    }, [budgetItems]);

    // Check if any budget item is incomplete
    const hasIncompleteBudgets = useMemo(() => {
      if (!budgetItems || budgetItems.length === 0) return false;
      return budgetItems.some(
        (item: any) => !item.description || item.description.trim() === "" || !item.amount || item.amount === 0
      );
    }, [budgetItems]);

    // Initialize with no rows by default (optional field)
    useEffect(() => {
      if (!initialized) {
        setInitialized(true);
      }
    }, [initialized]);

    // Notify parent about count changes
    useEffect(() => {
      if (onBudgetCountChange) {
        // Count budget items or 1 if there's budget data (to show the budget card)
        const count = budgetItems && budgetItems.length > 0 ? 1 : 0;
        onBudgetCountChange(count);
      }
    }, [budgetItems, onBudgetCountChange]);

    const handleAddBudgetItem = useCallback(() => {
      append({
        description: "",
        amount: null,
      });
    }, [append]);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        addBudget: handleAddBudgetItem,
      }),
      [handleAddBudgetItem]
    );

    const canRemove = fields.length > 0;

    return (
      <View style={styles.container}>
        {/* Expiry Date and Total in same row - Always shown when there are budget items */}
        {budgetItems && budgetItems.length > 0 && (
          <View style={styles.headerRow}>
            <View style={styles.headerField}>
              <Label required>
                <View style={styles.labelRow}>
                  <IconCalendar size={16} color={colors.foreground} />
                  <ThemedText>Data de Validade</ThemedText>
                </View>
              </Label>
              <DatePicker
                value={budgetExpiresIn ?? undefined}
                onChange={(date) => {
                  // Update via control
                }}
                type="date"
                placeholder="Selecione a data"
                disabled={disabled}
              />
            </View>

            <View style={styles.headerField}>
              <Label>
                <View style={styles.labelRow}>
                  <IconCurrencyReal size={16} color={colors.foreground} />
                  <ThemedText>Valor Total</ThemedText>
                </View>
              </Label>
              <Input
                value={formatCurrency(calculatedTotal)}
                editable={false}
                style={[styles.totalInput, { color: colors.primary }]}
              />
            </View>
          </View>
        )}

        {fields.length > 0 && (
          <View style={styles.itemsContainer}>
            {fields.map((field, index) => (
              <View key={field.id} ref={index === fields.length - 1 ? lastRowRef : null} style={styles.itemRow}>
                <View style={styles.itemFields}>
                  {/* Description Field */}
                  <View style={styles.itemField}>
                    {index === 0 && (
                      <Label>
                        <View style={styles.labelRow}>
                          <IconFileText size={16} color={colors.foreground} />
                          <ThemedText>Descrição do Item</ThemedText>
                        </View>
                      </Label>
                    )}
                    <Input
                      placeholder="Ex: Pintura lateral, Aerografia logo"
                      disabled={disabled}
                    />
                  </View>

                  {/* Amount Field */}
                  <View style={styles.itemField}>
                    {index === 0 && (
                      <Label>
                        <View style={styles.labelRow}>
                          <IconCurrencyReal size={16} color={colors.foreground} />
                          <ThemedText>Valor</ThemedText>
                        </View>
                      </Label>
                    )}
                    <Input
                      type="currency"
                      placeholder="R$ 0,00"
                      disabled={disabled}
                    />
                  </View>
                </View>

                {/* Remove Button */}
                <TouchableOpacity
                  onPress={() => remove(index)}
                  disabled={disabled}
                  style={[styles.removeButton, { opacity: disabled ? 0.5 : 1 }]}
                >
                  <IconTrash size={18} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Validation Alert - Only for incomplete items */}
        {hasIncompleteBudgets && (
          <View style={[styles.alert, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }]}>
            <ThemedText style={[styles.alertText, { color: colors.destructive }]}>
              Alguns itens do orçamento estão incompletos. Preencha a descrição e o valor antes de enviar o formulário.
            </ThemedText>
          </View>
        )}
      </View>
    );
  }
);

BudgetSelector.displayName = "BudgetSelector";

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  headerField: {
    flex: 1,
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  totalInput: {
    fontWeight: fontWeight.semibold,
  },
  itemsContainer: {
    gap: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-end",
  },
  itemFields: {
    flex: 1,
    gap: spacing.md,
  },
  itemField: {
    gap: spacing.sm,
  },
  removeButton: {
    padding: spacing.sm,
    marginBottom: spacing.xxs,
  },
  alert: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  alertText: {
    fontSize: fontSize.sm,
  },
});
