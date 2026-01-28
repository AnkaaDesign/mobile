import { useState, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, TextInput, Text as RNText } from "react-native";
import { useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { SERVICE_ORDER_TYPE } from "@/constants/enums";
import { DISCOUNT_TYPE_LABELS, PAYMENT_CONDITION_LABELS, GUARANTEE_YEARS_LABELS, TASK_PRICING_STATUS_LABELS } from "@/constants/enum-labels";
import { DISCOUNT_TYPE, PAYMENT_CONDITION, TASK_PRICING_STATUS } from "@/constants/enums";
import { getServiceDescriptionsByType } from "@/constants/service-descriptions";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formatCurrency } from "@/utils";
import { IconNote, IconTrash, IconPlus, IconCalendar, IconCurrencyReal, IconPhoto } from "@tabler/icons-react-native";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";

// Payment condition options
const PAYMENT_CONDITIONS = [
  { value: "CASH", label: "À vista" },
  { value: "INSTALLMENTS_2", label: "Entrada + 20" },
  { value: "INSTALLMENTS_3", label: "Entrada + 20/40" },
  { value: "INSTALLMENTS_4", label: "Entrada + 20/40/60" },
  { value: "INSTALLMENTS_5", label: "Entrada + 20/40/60/80" },
  { value: "INSTALLMENTS_6", label: "Entrada + 20/40/60/80/100" },
  { value: "INSTALLMENTS_7", label: "Entrada + 20/40/60/80/100/120" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Guarantee options
const GUARANTEE_OPTIONS = [
  { value: "5", label: "5 anos" },
  { value: "10", label: "10 anos" },
  { value: "15", label: "15 anos" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

// Validity period options
const VALIDITY_PERIOD_OPTIONS = [
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "60", label: "60 dias" },
  { value: "90", label: "90 dias" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Rejeitado" },
  { value: "CANCELLED", label: "Cancelado" },
];

interface PricingSelectorProps {
  control: any;
  disabled?: boolean;
  userRole?: string;
  onItemCountChange?: (count: number) => void;
  layoutFiles?: FilePickerItem[];
  onLayoutFilesChange?: (files: FilePickerItem[]) => void;
}

export interface PricingSelectorRef {
  addItem: () => void;
  clearAll: () => void;
}

export const PricingSelector = forwardRef<PricingSelectorRef, PricingSelectorProps>(
  ({ control, disabled, userRole, onItemCountChange, layoutFiles: externalLayoutFiles, onLayoutFilesChange }, ref) => {
    const { colors } = useTheme();
    const [validityPeriod, setValidityPeriod] = useState<number | null>(null);
    const [showCustomPayment, setShowCustomPayment] = useState(false);
    const [showCustomGuarantee, setShowCustomGuarantee] = useState(false);
    // Use external layout files if provided, otherwise use local state
    const [localLayoutFiles, setLocalLayoutFiles] = useState<FilePickerItem[]>([]);
    const layoutFiles = externalLayoutFiles ?? localLayoutFiles;
    const setLayoutFiles = onLayoutFilesChange ?? setLocalLayoutFiles;
    const [initialized, setInitialized] = useState(false);
    const { setValue, clearErrors, getValues } = useFormContext();

    const { fields, append, prepend, remove } = useFieldArray({
      control,
      name: "pricing.items",
    });

    // Watch pricing values
    const pricingItems = useWatch({ control, name: "pricing.items" });
    const pricingStatus = useWatch({ control, name: "pricing.status" }) || "DRAFT";
    const pricingExpiresAt = useWatch({ control, name: "pricing.expiresAt" });
    const discountType = useWatch({ control, name: "pricing.discountType" }) || DISCOUNT_TYPE.NONE;
    const discountValue = useWatch({ control, name: "pricing.discountValue" });
    const paymentCondition = useWatch({ control, name: "pricing.paymentCondition" });
    const customPaymentText = useWatch({ control, name: "pricing.customPaymentText" });
    const guaranteeYears = useWatch({ control, name: "pricing.guaranteeYears" });
    const customGuaranteeText = useWatch({ control, name: "pricing.customGuaranteeText" });
    const layoutFileId = useWatch({ control, name: "pricing.layoutFileId" });

    // Current payment condition
    const currentPaymentCondition = useMemo(() => {
      if (customPaymentText) return "CUSTOM";
      return paymentCondition || "";
    }, [paymentCondition, customPaymentText]);

    // Derive current guarantee option
    const currentGuaranteeOption = useMemo(() => {
      if (customGuaranteeText) return "CUSTOM";
      if (guaranteeYears) return guaranteeYears.toString();
      return "";
    }, [guaranteeYears, customGuaranteeText]);

    // Initialize custom states from existing data
    useEffect(() => {
      if (customPaymentText && !showCustomPayment) {
        setShowCustomPayment(true);
      }
      if (customGuaranteeText && !showCustomGuarantee) {
        setShowCustomGuarantee(true);
      }
    }, [customPaymentText, customGuaranteeText, showCustomPayment, showCustomGuarantee]);

    // Calculate subtotal
    const subtotal = useMemo(() => {
      if (!pricingItems || pricingItems.length === 0) return 0;
      return pricingItems.reduce((sum: number, item: any) => {
        const amount = typeof item.amount === "number" ? item.amount : Number(item.amount) || 0;
        return sum + amount;
      }, 0);
    }, [pricingItems]);

    // Calculate discount amount
    const discountAmount = useMemo(() => {
      if (discountType === DISCOUNT_TYPE.NONE || !discountValue) return 0;
      if (discountType === DISCOUNT_TYPE.PERCENTAGE) {
        return Math.round(((subtotal * discountValue) / 100) * 100) / 100;
      }
      if (discountType === DISCOUNT_TYPE.FIXED_VALUE) {
        return discountValue;
      }
      return 0;
    }, [subtotal, discountType, discountValue]);

    // Calculate total
    const calculatedTotal = useMemo(() => {
      return Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
    }, [subtotal, discountAmount]);

    // Initialize local state from form data
    useEffect(() => {
      if (!initialized) {
        const expiresAt = getValues("pricing.expiresAt");
        const items = getValues("pricing.items");
        const hasItems = items && items.length > 0;

        if (expiresAt) {
          const today = new Date();
          const diffTime = new Date(expiresAt).getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= 90) {
            setValidityPeriod(diffDays);
          } else {
            setValidityPeriod(30);
          }
        } else {
          // Default to 30 days
          setValidityPeriod(30);
          // If there are items but no expiresAt, set a default expiry date
          // This fixes validation errors when editing tasks with pricing items but no expiry
          if (hasItems) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            expiryDate.setHours(23, 59, 59, 999);
            setValue("pricing.expiresAt", expiryDate, { shouldDirty: false });
          }
        }
        setInitialized(true);
      }
    }, [initialized, getValues, setValue]);

    // Notify parent about count changes
    useEffect(() => {
      if (onItemCountChange) {
        const count = pricingItems && pricingItems.length > 0 ? 1 : 0;
        onItemCountChange(count);
      }
    }, [pricingItems, onItemCountChange]);

    // Update subtotal and total in form
    useEffect(() => {
      if (pricingItems && pricingItems.length > 0) {
        const currentSubtotal = getValues("pricing.subtotal");
        const currentTotal = getValues("pricing.total");
        if (currentSubtotal !== subtotal) {
          setValue("pricing.subtotal", subtotal, { shouldDirty: false });
        }
        if (currentTotal !== calculatedTotal) {
          setValue("pricing.total", calculatedTotal, { shouldDirty: false });
        }
      }
    }, [subtotal, calculatedTotal, pricingItems, setValue, getValues]);

    const handleAddItem = useCallback(() => {
      clearErrors("pricing");
      if (fields.length === 0) {
        const defaultPeriod = 30;
        setValidityPeriod(defaultPeriod);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + defaultPeriod);
        expiryDate.setHours(23, 59, 59, 999);
        setValue("pricing.expiresAt", expiryDate);
        setValue("pricing.status", "DRAFT");
        setValue("pricing.discountType", DISCOUNT_TYPE.NONE);
        setValue("pricing.discountValue", null);
        setValue("pricing.subtotal", 0);
        setValue("pricing.total", 0);
      }
      // Use append to preserve addition order (first added = first position)
      // Incomplete items are displayed at top via the grouping logic
      append({ description: "", observation: null, amount: undefined });
    }, [append, clearErrors, fields.length, setValue]);

    const clearAll = useCallback(() => {
      for (let i = fields.length - 1; i >= 0; i--) {
        remove(i);
      }
      setValue("pricing", undefined);
      clearErrors("pricing");
      setValidityPeriod(null);
      setShowCustomPayment(false);
      setShowCustomGuarantee(false);
      setLayoutFiles([]);
    }, [fields.length, remove, setValue, clearErrors, setLayoutFiles]);

    useImperativeHandle(ref, () => ({ addItem: handleAddItem, clearAll }), [handleAddItem, clearAll]);

    const canEditStatus = userRole === "ADMIN" || userRole === "FINANCIAL" || userRole === "COMMERCIAL";

    const handleValidityPeriodChange = useCallback(
      (period: string) => {
        const days = Number(period);
        setValidityPeriod(days);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        expiryDate.setHours(23, 59, 59, 999);
        setValue("pricing.expiresAt", expiryDate);
      },
      [setValue]
    );

    const handlePaymentConditionChange = useCallback(
      (value: string) => {
        if (value === "CUSTOM") {
          setShowCustomPayment(true);
          setValue("pricing.paymentCondition", "CUSTOM");
        } else {
          setShowCustomPayment(false);
          setValue("pricing.customPaymentText", null);
          setValue("pricing.paymentCondition", value);
        }
      },
      [setValue]
    );

    const handleGuaranteeOptionChange = useCallback(
      (value: string) => {
        if (value === "CUSTOM") {
          setShowCustomGuarantee(true);
          setValue("pricing.guaranteeYears", null);
        } else {
          setShowCustomGuarantee(false);
          setValue("pricing.customGuaranteeText", null);
          setValue("pricing.guaranteeYears", value ? Number(value) : null);
        }
      },
      [setValue]
    );

    const handleRemoveItem = useCallback(
      (index: number) => {
        remove(index);
      },
      [remove]
    );

    // Handle layout file change
    const handleLayoutFileChange = useCallback((files: FilePickerItem[]) => {
      setLayoutFiles(files);
      // Only set layoutFileId if it's an existing uploaded file (has id and uploaded=true)
      if (files.length > 0 && files[0].id && files[0].uploaded) {
        setValue("pricing.layoutFileId", files[0].id);
      } else if (files.length === 0) {
        setValue("pricing.layoutFileId", null);
      }
      // For new files, layoutFileId stays null - the file will be uploaded during form submission
    }, [setValue, setLayoutFiles]);

    const hasPricingItems = pricingItems && pricingItems.length > 0;

    // Separate incomplete items (shown at top) from complete items (shown below in order)
    // An item is complete if it has a description with at least 3 characters
    const { incompleteIndices, completeIndices } = useMemo(() => {
      const incomplete: number[] = [];
      const complete: number[] = [];

      fields.forEach((field, index) => {
        const item = pricingItems?.[index];
        const isComplete = item?.description && item.description.trim().length >= 3;

        if (isComplete) {
          complete.push(index);
        } else {
          incomplete.push(index);
        }
      });

      return { incompleteIndices: incomplete, completeIndices: complete };
    }, [fields, pricingItems]);

    return (
      <View style={styles.container}>
        {/* Add Service Button - Full width above rows */}
        {!disabled && (
          <Button variant="outline" size="sm" onPress={handleAddItem} disabled={disabled} style={styles.addButton}>
            <IconPlus size={16} color={colors.foreground} />
            <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>Adicionar Serviço</ThemedText>
          </Button>
        )}

        {/* Incomplete Items Section - Items being configured (shown at top) */}
        {incompleteIndices.length > 0 && (
          <View style={[styles.section, styles.incompleteSection, { borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                Configurando Serviço
              </ThemedText>
              <ThemedText style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                Preencha a descrição
              </ThemedText>
            </View>
            {incompleteIndices.map((index) => (
              <PricingItemRow
                key={fields[index].id}
                control={control}
                index={index}
                disabled={disabled}
                onRemove={() => handleRemoveItem(index)}
                isLastRow={false}
              />
            ))}
          </View>
        )}

        {/* Complete Items Section - Items with description (in their position order) */}
        {completeIndices.length > 0 && (
          <View style={styles.section}>
            {completeIndices.map((index) => (
              <PricingItemRow
                key={fields[index].id}
                control={control}
                index={index}
                disabled={disabled}
                onRemove={() => handleRemoveItem(index)}
                isLastRow={index === fields.length - 1}
              />
            ))}
          </View>
        )}

        {/* Spacing between items and configuration sections */}
        {hasPricingItems && (
          <View style={styles.itemsConfigSpacer} />
        )}

        {/* Discount Section */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Tipo de Desconto</ThemedText>
                <Combobox
                  value={discountType || DISCOUNT_TYPE.NONE}
                  onValueChange={(value) => {
                    const safeType = value || DISCOUNT_TYPE.NONE;
                    const previousType = discountType || DISCOUNT_TYPE.NONE;
                    setValue("pricing.discountType", safeType);
                    if (safeType === DISCOUNT_TYPE.NONE) {
                      setValue("pricing.discountValue", null);
                    } else if (previousType !== safeType && previousType !== DISCOUNT_TYPE.NONE) {
                      setValue("pricing.discountValue", null);
                    }
                  }}
                  disabled={disabled}
                  options={[DISCOUNT_TYPE.NONE, DISCOUNT_TYPE.PERCENTAGE, DISCOUNT_TYPE.FIXED_VALUE].map((type) => ({
                    value: type,
                    label: DISCOUNT_TYPE_LABELS[type],
                  }))}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
                  Valor do Desconto{" "}
                  {discountType === DISCOUNT_TYPE.PERCENTAGE && <ThemedText style={{ color: colors.mutedForeground }}>(%)</ThemedText>}
                  {discountType === DISCOUNT_TYPE.FIXED_VALUE && <ThemedText style={{ color: colors.mutedForeground }}>(R$)</ThemedText>}
                </ThemedText>
                <Input
                  type={discountType === DISCOUNT_TYPE.FIXED_VALUE ? "currency" : "number"}
                  value={discountValue ?? ""}
                  onChange={(value) => {
                    if (value === null || value === undefined || value === "") {
                      setValue("pricing.discountValue", null);
                    } else {
                      setValue("pricing.discountValue", typeof value === "number" ? value : Number(value));
                    }
                  }}
                  disabled={disabled || discountType === DISCOUNT_TYPE.NONE}
                  placeholder={discountType === DISCOUNT_TYPE.NONE ? "-" : discountType === DISCOUNT_TYPE.FIXED_VALUE ? "R$ 0,00" : "0"}
                />
              </View>
            </View>
          </View>
        )}

        {/* Totals Section */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Subtotal</ThemedText>
                </View>
                <View style={[styles.readOnlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <ThemedText style={[styles.readOnlyText, { color: colors.foreground }]}>{formatCurrency(subtotal)}</ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCurrencyReal size={14} color={colors.primary} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4 }]}>Valor Total</ThemedText>
                </View>
                <View style={[styles.readOnlyField, styles.totalField, { borderColor: colors.primary }]}>
                  <ThemedText style={[styles.totalText, { color: colors.primary }]}>{formatCurrency(calculatedTotal)}</ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Spacing between totals and status */}
        {hasPricingItems && <View style={styles.itemsConfigSpacer} />}

        {/* Status and Validity */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <ThemedText style={[styles.label, { color: colors.foreground, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">Status</ThemedText>
                </View>
                <Combobox
                  value={pricingStatus || "DRAFT"}
                  onValueChange={(value) => setValue("pricing.status", value)}
                  disabled={disabled || !canEditStatus}
                  options={STATUS_OPTIONS}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <View style={styles.labelWithIcon}>
                  <IconCalendar size={14} color={colors.mutedForeground} />
                  <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]}>
                    Validade <ThemedText style={{ color: colors.destructive }}>*</ThemedText>
                  </ThemedText>
                </View>
                <Combobox
                  value={validityPeriod?.toString() || ""}
                  onValueChange={handleValidityPeriodChange}
                  disabled={disabled}
                  options={VALIDITY_PERIOD_OPTIONS}
                  placeholder="Período"
                  searchable={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* Payment, Guarantee */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Condição de Pagamento</ThemedText>
                <Combobox
                  value={currentPaymentCondition}
                  onValueChange={handlePaymentConditionChange}
                  disabled={disabled}
                  options={PAYMENT_CONDITIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Período de Garantia</ThemedText>
                <Combobox
                  value={currentGuaranteeOption}
                  onValueChange={handleGuaranteeOptionChange}
                  disabled={disabled}
                  options={GUARANTEE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  placeholder="Selecione"
                  searchable={false}
                />
              </View>
            </View>
          </View>
        )}

        {/* Custom Payment Text */}
        {hasPricingItems && showCustomPayment && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Pagamento</ThemedText>
            <TextInput
              value={customPaymentText || ""}
              onChangeText={(text) => setValue("pricing.customPaymentText", text || null)}
              placeholder="Descreva as condições de pagamento..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              editable={!disabled}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>
        )}

        {/* Custom Guarantee Text */}
        {hasPricingItems && showCustomGuarantee && (
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">Texto Personalizado de Garantia</ThemedText>
            <TextInput
              value={customGuaranteeText || ""}
              onChangeText={(text) => setValue("pricing.customGuaranteeText", text || null)}
              placeholder="Descreva as condições de garantia..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              editable={!disabled}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>
        )}

        {/* Spacing before layout */}
        {hasPricingItems && <View style={styles.itemsConfigSpacer} />}

        {/* Layout Aprovado - File Upload */}
        {hasPricingItems && (
          <View style={styles.section}>
            <View style={styles.labelWithIcon}>
              <IconPhoto size={14} color={colors.mutedForeground} />
              <ThemedText style={[styles.label, { color: colors.foreground, marginLeft: 4, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                Layout Aprovado
              </ThemedText>
            </View>
            <FilePicker
              value={layoutFiles}
              onChange={handleLayoutFileChange}
              maxFiles={1}
              placeholder="Selecione o layout aprovado"
              helperText="Arraste ou clique para selecionar"
              disabled={disabled}
              showCamera={true}
              showGallery={true}
              showFilePicker={false}
              acceptedFileTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
            />
          </View>
        )}
      </View>
    );
  }
);

PricingSelector.displayName = "PricingSelector";

// Pricing Item Row Component
interface PricingItemRowProps {
  control: any;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  isLastRow: boolean;
}

function PricingItemRow({ control, index, disabled, onRemove, isLastRow }: PricingItemRowProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const [observationModal, setObservationModal] = useState({ visible: false, text: "" });

  const description = useWatch({ control, name: `pricing.items.${index}.description` });
  const amount = useWatch({ control, name: `pricing.items.${index}.amount` });
  const observation = useWatch({ control, name: `pricing.items.${index}.observation` });

  // Get description options from service descriptions
  const descriptionOptions = useMemo(() => {
    const baseOptions = getServiceDescriptionsByType(SERVICE_ORDER_TYPE.PRODUCTION).map((desc) => ({
      value: desc,
      label: desc,
    }));

    // If the current description exists but isn't in the predefined list, add it to options
    // This ensures existing values can be displayed when editing
    if (description && description.trim().length > 0) {
      const descriptionExists = baseOptions.some(opt => opt.value === description);
      if (!descriptionExists) {
        return [{ value: description, label: description }, ...baseOptions];
      }
    }

    return baseOptions;
  }, [description]);

  const handleSaveObservation = () => {
    setValue(`pricing.items.${index}.observation`, observationModal.text || null);
    setObservationModal({ visible: false, text: observationModal.text });
  };

  const hasObservation = !!observation && observation.trim().length > 0;

  return (
    <View style={styles.itemRow}>
      {/* Description */}
      <View style={styles.descriptionField}>
        <Combobox
          value={description || ""}
          onValueChange={(value) => setValue(`pricing.items.${index}.description`, value || "")}
          disabled={disabled}
          options={descriptionOptions}
          placeholder="Selecione o serviço..."
          searchable
          clearable={false}
        />
      </View>

      {/* Amount + Actions */}
      <View style={styles.amountRow}>
        <View style={styles.amountField}>
          <Input
            type="currency"
            value={amount ?? ""}
            onChange={(value) => setValue(`pricing.items.${index}.amount`, value)}
            disabled={disabled}
            placeholder="R$ 0,00"
          />
        </View>

        {/* Observation Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              borderColor: hasObservation ? colors.primary : colors.border,
              backgroundColor: hasObservation ? colors.primary + "15" : colors.card,
            },
          ]}
          onPress={() => setObservationModal({ visible: true, text: observation || "" })}
          disabled={disabled}
        >
          <IconNote size={16} color={hasObservation ? colors.primary : colors.mutedForeground} />
          {hasObservation && (
            <View style={styles.observationIndicator}>
              <RNText style={styles.observationIndicatorText}>!</RNText>
            </View>
          )}
        </TouchableOpacity>

        {/* Remove Button */}
        {!disabled && (
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]} onPress={onRemove}>
            <IconTrash size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}

      </View>

      {/* Observation Modal */}
      <Modal
        visible={observationModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setObservationModal({ visible: false, text: observation || "" })}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setObservationModal({ visible: false, text: observation || "" })}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <IconNote size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>Observação</ThemedText>
            </View>
            <TextInput
              value={observationModal.text}
              onChangeText={(text) => setObservationModal({ ...observationModal, text })}
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
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setObservationModal({ visible: false, text: observation || "" })}
              >
                <ThemedText style={{ color: colors.foreground }}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, { backgroundColor: colors.primary }]} onPress={handleSaveObservation}>
                <RNText style={styles.modalSaveButtonText}>Salvar</RNText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  incompleteSection: {
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  sectionHint: {
    fontSize: fontSize.xs,
  },
  itemsConfigSpacer: {
    height: spacing.lg,
  },
  borderedSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
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
  readOnlyText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  totalField: {
    borderWidth: 2,
  },
  totalText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Item Row styles
  itemRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  descriptionField: {
    width: "100%",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  amountField: {
    flex: 1,
    minWidth: 0,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.DEFAULT,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flexShrink: 0,
  },
  observationIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  observationIndicatorText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#ffffff",
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
  modalCancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalSaveButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
  },
  modalSaveButtonText: {
    color: "#ffffff",
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  borderedSection: {
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
});

export default PricingSelector;
