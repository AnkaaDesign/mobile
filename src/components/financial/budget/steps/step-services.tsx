/**
 * StepServices - Services & Pricing step for budget wizards
 *
 * Replaces the inline Step2Services / ServiceItemRow from task-quote-wizard.tsx.
 * Works for both create mode (field prefix '') and edit mode (field prefix 'quote.').
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Text as RNText,
} from "react-native";
import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import {
  IconPlus,
  IconTrash,
  IconNote,
  IconCurrencyReal,
} from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { FormCard } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { SERVICE_ORDER_TYPE, DISCOUNT_TYPE } from "@/constants/enums";
import { DISCOUNT_TYPE_LABELS } from "@/constants/enum-labels";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { formatCurrency } from "@/utils";
import {
  computeConfigDiscount,
  computeCustomerConfigTotals,
} from "@/utils/task-quote-calculations";
import {
  getQuoteServicesToAddFromServiceOrders,
  type SyncServiceOrder,
} from "@/utils/task-quote-service-order-sync";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepServicesProps {
  control: any;
  task: any;
  selectedCustomers: Map<string, any>;
  mode: "create" | "edit";
  /**
   * Field prefix for react-hook-form paths.
   * '' for create mode, 'quote.' for edit mode.
   */
  fieldPrefix: string;
}

// ---------------------------------------------------------------------------
// Service Item Card (inner component)
// ---------------------------------------------------------------------------

interface ServiceItemCardProps {
  control: any;
  index: number;
  fieldPrefix: string;
  onRemove: () => void;
  customerConfigCustomers?: Array<{
    id: string;
    fantasyName?: string;
    corporateName?: string;
  }>;
}

function ServiceItemCard({
  control,
  index,
  fieldPrefix,
  onRemove,
  customerConfigCustomers,
}: ServiceItemCardProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const [observationModal, setObservationModal] = useState({
    visible: false,
    text: "",
  });

  const servicesPath = `${fieldPrefix}services`;

  const description = useWatch({
    control,
    name: `${servicesPath}.${index}.description`,
  });
  const amount = useWatch({
    control,
    name: `${servicesPath}.${index}.amount`,
  });
  const observation = useWatch({
    control,
    name: `${servicesPath}.${index}.observation`,
  });
  const invoiceToCustomerId = useWatch({
    control,
    name: `${servicesPath}.${index}.invoiceToCustomerId`,
  });

  const hasMultipleCustomers =
    customerConfigCustomers && customerConfigCustomers.length >= 2;

  // Build description options from production service descriptions
  const descriptionOptions = useMemo(() => {
    const baseOptions = getServiceDescriptionsByType(
      SERVICE_ORDER_TYPE.PRODUCTION,
    ).map((desc) => ({
      value: desc,
      label: desc,
    }));

    // Include the current description if it's custom (not in base list)
    if (description && description.trim().length > 0) {
      const descriptionExists = baseOptions.some(
        (opt) => opt.value === description,
      );
      if (!descriptionExists) {
        return [{ value: description, label: description }, ...baseOptions];
      }
    }

    return baseOptions;
  }, [description]);

  const handleSaveObservation = () => {
    setValue(
      `${servicesPath}.${index}.observation`,
      observationModal.text || null,
    );
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View
      style={[
        styles.serviceCard,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      {/* Description */}
      <View style={{ width: "100%" }}>
        <Combobox
          value={description || ""}
          onValueChange={(v) =>
            setValue(`${servicesPath}.${index}.description`, v || "")
          }
          options={descriptionOptions}
          placeholder="Selecione o servico..."
          searchable
          clearable={false}
        />
      </View>

      {/* Amount + Observation + Remove */}
      <View style={styles.amountRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Input
            type="currency"
            value={amount ?? ""}
            onChange={(v) => setValue(`${servicesPath}.${index}.amount`, v)}
            placeholder="R$ 0,00"
            fieldKey={`svc-item-${index}-amount`}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: hasObservation ? colors.primary : colors.border,
              backgroundColor: hasObservation
                ? colors.primary + "15"
                : colors.card,
            },
          ]}
          onPress={() =>
            setObservationModal({ visible: true, text: observation || "" })
          }
        >
          <IconNote
            size={16}
            color={hasObservation ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={onRemove}
        >
          <IconTrash size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Invoice To Customer (when multiple customers) */}
      {hasMultipleCustomers && (
        <View style={{ marginTop: spacing.xs }}>
          <ThemedText
            style={{
              fontSize: 11,
              color: colors.mutedForeground,
              marginBottom: 2,
            }}
          >
            Faturar para
          </ThemedText>
          <Combobox
            value={invoiceToCustomerId || ""}
            onValueChange={(v) =>
              setValue(
                `${servicesPath}.${index}.invoiceToCustomerId`,
                v || null,
              )
            }
            options={customerConfigCustomers!.map((c) => ({
              value: c.id,
              label: c.fantasyName || c.corporateName || "Cliente",
            }))}
            placeholder="Selecione cliente"
            searchable={false}
          />
        </View>
      )}

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setObservationModal({ visible: false, text: observation || "" })
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setObservationModal({ visible: false, text: observation || "" })
          }
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <IconNote size={20} color={colors.mutedForeground} />
              <ThemedText
                style={[styles.modalTitle, { color: colors.foreground }]}
              >
                Observacao
              </ThemedText>
            </View>
            <TextInput
              value={observationModal.text}
              onChangeText={(t) =>
                setObservationModal({ ...observationModal, text: t })
              }
              placeholder="Adicione notas ou detalhes adicionais..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[
                styles.modalTextInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() =>
                  setObservationModal({
                    visible: false,
                    text: observation || "",
                  })
                }
              >
                <ThemedText style={{ color: colors.foreground }}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveObservation}
              >
                <RNText
                  style={{
                    color: "#ffffff",
                    fontSize: fontSize.sm,
                    fontWeight: "600",
                  }}
                >
                  Salvar
                </RNText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// StepServices (main export)
// ---------------------------------------------------------------------------

export function StepServices({
  control,
  task,
  selectedCustomers,
  mode,
  fieldPrefix,
}: StepServicesProps) {
  const { colors } = useTheme();
  const { setValue, getValues, clearErrors } = useFormContext();
  const [syncedOnMount, setSyncedOnMount] = useState(false);

  const servicesPath = `${fieldPrefix}services`;
  const customerConfigsPath = `${fieldPrefix}customerConfigs`;
  const subtotalPath = `${fieldPrefix}subtotal`;
  const totalPath = `${fieldPrefix}total`;

  const { fields, append, remove } = useFieldArray({
    control,
    name: servicesPath,
  });

  const quoteItems = useWatch({ control, name: servicesPath });
  const watchedCustomerConfigs = useWatch({ control, name: customerConfigsPath });

  // ---------------------------------------------------------------------------
  // Service order sync on mount (edit mode only)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== "edit") return;
    if (syncedOnMount || !task) return;
    setSyncedOnMount(true);

    const serviceOrders: SyncServiceOrder[] = (
      task.serviceOrders || []
    ).filter((so: any) => so.type === SERVICE_ORDER_TYPE.PRODUCTION);
    if (serviceOrders.length === 0) return;

    const currentServices = getValues(servicesPath) || [];
    const toAdd = getQuoteServicesToAddFromServiceOrders(
      serviceOrders,
      currentServices,
    );
    if (toAdd.length > 0) {
      toAdd.forEach((svc) => {
        append(
          {
            description: svc.description,
            observation: svc.observation || null,
            amount: svc.amount ?? 0,
            invoiceToCustomerId: null,
          },
          { shouldFocus: false },
        );
      });
    }
  }, [mode, task, syncedOnMount, getValues, append, servicesPath]);

  // ---------------------------------------------------------------------------
  // Auto-calculate per-customer subtotals/totals
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const configs = watchedCustomerConfigs;
    if (!Array.isArray(configs) || configs.length < 1 || !quoteItems) return;

    const isSingleConfig = configs.length === 1;
    let updated = false;
    const newConfigs = configs.map((config: any) => {
      if (!config?.customerId) return config;
      const { subtotal, total } = computeCustomerConfigTotals(
        quoteItems,
        config.customerId,
        isSingleConfig,
        config.discountType,
        config.discountValue,
      );
      if (config.subtotal !== subtotal || config.total !== total) {
        updated = true;
        return { ...config, subtotal, total };
      }
      return config;
    });
    if (updated) {
      setValue(customerConfigsPath, newConfigs, { shouldDirty: false });
    }
  }, [quoteItems, watchedCustomerConfigs, setValue, customerConfigsPath]);

  // ---------------------------------------------------------------------------
  // Subtotal (sum of amounts, no discounts)
  // ---------------------------------------------------------------------------
  const subtotal = useMemo(() => {
    if (!quoteItems || quoteItems.length === 0) return 0;
    return quoteItems.reduce((sum: number, item: any) => {
      const amount =
        typeof item.amount === "number"
          ? item.amount
          : Number(item.amount) || 0;
      return sum + amount;
    }, 0);
  }, [quoteItems]);

  // ---------------------------------------------------------------------------
  // Aggregate total (uses customer config totals which include global discount)
  // ---------------------------------------------------------------------------
  const aggregateTotal = useMemo(() => {
    if (
      !Array.isArray(watchedCustomerConfigs) ||
      watchedCustomerConfigs.length === 0
    ) {
      // No configs: total equals subtotal (no discount without config)
      return subtotal;
    }
    return watchedCustomerConfigs.reduce(
      (sum: number, config: any) =>
        sum +
        (typeof config?.total === "number"
          ? config.total
          : Number(config?.total) || 0),
      0,
    );
  }, [watchedCustomerConfigs, quoteItems]);

  // ---------------------------------------------------------------------------
  // Update form subtotal/total fields
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (quoteItems && quoteItems.length > 0) {
      const configSubtotalSum =
        Array.isArray(watchedCustomerConfigs) &&
        watchedCustomerConfigs.length > 0
          ? watchedCustomerConfigs.reduce(
              (sum: number, c: any) => sum + (Number(c?.subtotal) || 0),
              0,
            )
          : subtotal;
      setValue(subtotalPath, configSubtotalSum, { shouldDirty: false });
      setValue(totalPath, aggregateTotal, { shouldDirty: false });
    }
  }, [
    subtotal,
    aggregateTotal,
    quoteItems,
    watchedCustomerConfigs,
    setValue,
    subtotalPath,
    totalPath,
  ]);

  // ---------------------------------------------------------------------------
  // Clear orphaned service assignments when customer configs change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const configs = watchedCustomerConfigs || [];
    const currentIds = Array.isArray(configs)
      ? configs.map((c: any) => c?.customerId).filter(Boolean)
      : [];
    const items = getValues(servicesPath) || [];
    items.forEach((item: any, index: number) => {
      if (
        item.invoiceToCustomerId &&
        !currentIds.includes(item.invoiceToCustomerId)
      ) {
        setValue(`${servicesPath}.${index}.invoiceToCustomerId`, null);
      }
    });
  }, [watchedCustomerConfigs, getValues, setValue, servicesPath]);

  // ---------------------------------------------------------------------------
  // Add service handler
  // ---------------------------------------------------------------------------
  const handleAddItem = useCallback(() => {
    // Clear form-level errors so the user can proceed
    try {
      clearErrors(fieldPrefix ? fieldPrefix.slice(0, -1) : undefined);
    } catch {
      // clearErrors may not support the path; ignore
    }
    append({
      description: "",
      observation: null,
      amount: undefined,
      invoiceToCustomerId: null,
    });
  }, [append, clearErrors, fieldPrefix]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const hasMultipleCustomers =
    Array.isArray(watchedCustomerConfigs) &&
    watchedCustomerConfigs.length >= 2;
  const customerConfigCustomers = Array.from(selectedCustomers.values());

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <FormCard title="Servicos e Valores" icon="IconTool">
      {/* Description */}
      <ThemedText
        style={[styles.stepDescription, { color: colors.mutedForeground }]}
      >
        Adicione os servicos e defina os valores de cada item.
      </ThemedText>

      {/* Add Service Button */}
      <Button
        variant="outline"
        size="sm"
        onPress={handleAddItem}
        style={styles.addButton}
      >
        <IconPlus size={16} color={colors.foreground} />
        <ThemedText
          style={{
            marginLeft: 4,
            fontSize: fontSize.sm,
            color: colors.foreground,
          }}
        >
          Adicionar Servico
        </ThemedText>
      </Button>

      {/* Service Items */}
      {fields.map((field, index) => (
        <ServiceItemCard
          key={field.id}
          control={control}
          index={index}
          fieldPrefix={fieldPrefix}
          onRemove={() => remove(index)}
          customerConfigCustomers={
            hasMultipleCustomers ? customerConfigCustomers : undefined
          }
        />
      ))}

      {/* Totals with discount controls per customer config */}
      {quoteItems && quoteItems.length > 0 && Array.isArray(watchedCustomerConfigs) && watchedCustomerConfigs.map((config: any, configIndex: number) => {
        const configSubtotal = Number(config?.subtotal) || 0;
        const configTotal = Number(config?.total) || 0;
        const discountType = config?.discountType || "NONE";
        const discountAmount = computeConfigDiscount(configSubtotal, discountType, config?.discountValue);
        const customer = selectedCustomers.get(config?.customerId);
        const customerName = customer?.corporateName || customer?.fantasyName || "";

        const setDiscountField = (field: string, value: any) => {
          const configs = getValues(customerConfigsPath) || [];
          const updated = configs.map((c: any, i: number) =>
            i === configIndex ? { ...c, [field]: value } : c,
          );
          setValue(customerConfigsPath, updated, { shouldDirty: true });
        };

        return (
          <View
            key={config?.customerId || configIndex}
            style={[styles.totalsSection, { borderTopColor: colors.border }]}
          >
            {hasMultipleCustomers && (
              <ThemedText style={{ fontSize: fontSize.xs, fontWeight: "600", color: colors.mutedForeground, marginBottom: spacing.xs, textTransform: "uppercase" }}>
                {customerName || `Cliente ${configIndex + 1}`}
              </ThemedText>
            )}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                    Subtotal
                  </ThemedText>
                </View>
                <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500", color: colors.foreground }}>
                    {formatCurrency(configSubtotal)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.primary} style={{ flexShrink: 0 }} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                    Valor Total
                  </ThemedText>
                </View>
                <View style={[styles.readOnlyField, { borderColor: colors.primary, borderWidth: 2 }]}>
                  <ThemedText style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.primary }}>
                    {formatCurrency(configTotal)}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Discount controls */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>
                  Desconto
                </ThemedText>
                <Combobox
                  value={discountType}
                  onValueChange={(v) => {
                    const safeType = v || "NONE";
                    setDiscountField("discountType", safeType);
                    if (safeType === "NONE") {
                      setDiscountField("discountValue", null);
                      setDiscountField("discountReference", null);
                    }
                  }}
                  options={Object.values(DISCOUNT_TYPE).map((type) => ({
                    value: type,
                    label: DISCOUNT_TYPE_LABELS[type],
                  }))}
                  placeholder="Nenhum"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>
                  Vlr. Desc.{" "}
                  {discountType === "PERCENTAGE" && "(%)"}
                  {discountType === "FIXED_VALUE" && "(R$)"}
                </ThemedText>
                <Input
                  type={discountType === "FIXED_VALUE" ? "currency" : "number"}
                  value={config?.discountValue ?? ""}
                  onChange={(v) =>
                    setDiscountField("discountValue", v === "" || v == null ? null : Number(v))
                  }
                  disabled={discountType === "NONE"}
                  placeholder={discountType === "NONE" ? "-" : discountType === "FIXED_VALUE" ? "R$ 0,00" : "0"}
                  fieldKey={`config-${configIndex}-discount`}
                />
              </View>
            </View>

            {discountType !== "NONE" && (
              <View style={{ marginTop: spacing.xs }}>
                <ThemedText style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 2 }}>
                  Referência do Desconto
                </ThemedText>
                <Input
                  value={config?.discountReference || ""}
                  onChange={(v) => setDiscountField("discountReference", v || null)}
                  placeholder="Justificativa..."
                  fieldKey={`config-${configIndex}-discount-ref`}
                />
              </View>
            )}

            {discountAmount > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.xs }}>
                <ThemedText style={{ fontSize: fontSize.sm, color: colors.destructive }}>Desconto</ThemedText>
                <ThemedText style={{ fontSize: fontSize.sm, fontWeight: "500", color: colors.destructive }}>
                  - {formatCurrency(discountAmount)}
                </ThemedText>
              </View>
            )}
          </View>
        );
      })}
    </FormCard>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  stepDescription: {
    fontSize: fontSize.sm,
    marginBottom: formSpacing.fieldGap,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: formSpacing.fieldGap,
  },
  serviceCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: 12,
    gap: spacing.sm,
    marginBottom: formSpacing.fieldGap,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  readOnlyField: {
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  totalsSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  modalTextInput: {
    fontSize: fontSize.sm,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
});
