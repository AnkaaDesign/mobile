import { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { useWatch, useFormContext } from "react-hook-form";
import { IconCurrencyReal } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import { formSpacing } from "@/constants/form-styles";
import { PAYMENT_CONDITIONS } from "@/constants/budget-billing";
import { RESPONSIBLE_ROLE_LABELS } from "@/types/responsible";
import { formatCurrency } from "@/utils";

interface StepCustomerPaymentProps {
  control: any;
  configIndex: number;
  customer: any;
  taskResponsibles?: Array<{ id: string; name: string; role: string }>;
  fieldPrefix?: string; // '' for create, 'quote.' for edit
}

export function StepCustomerPayment({
  control,
  configIndex,
  customer,
  taskResponsibles,
  fieldPrefix = "",
}: StepCustomerPaymentProps) {
  const { colors } = useTheme();
  const { setValue } = useFormContext();
  const keyboardContext = useKeyboardAwareForm();
  const [showCustomPayment, setShowCustomPayment] = useState(false);

  const basePath = `${fieldPrefix}customerConfigs.${configIndex}`;

  const config = useWatch({
    control,
    name: basePath,
  });

  // Initialize custom payment state from existing data
  useEffect(() => {
    if (config?.customPaymentText && !showCustomPayment) {
      setShowCustomPayment(true);
    }
  }, [config?.customPaymentText, showCustomPayment]);

  // Default budget responsible to the first non-temp task responsible on mount
  const hasAutoDefaulted = useRef(false);
  useEffect(() => {
    if (hasAutoDefaulted.current) return;
    if (
      taskResponsibles &&
      taskResponsibles.length > 0 &&
      !config?.responsibleId
    ) {
      hasAutoDefaulted.current = true;
      const firstValid = taskResponsibles.find(
        (r) => !r.id.startsWith("temp-"),
      );
      if (firstValid) {
        setValue(`${basePath}.responsibleId`, firstValid.id, {
          shouldDirty: false,
        });
      }
    }
  }, [taskResponsibles, config?.responsibleId, setValue, basePath]);

  const handlePaymentConditionChange = useCallback(
    (val: string | string[] | null | undefined) => {
      const value = typeof val === "string" ? val : "";
      if (value === "CUSTOM") {
        setShowCustomPayment(true);
        setValue(`${basePath}.paymentCondition`, "CUSTOM");
      } else {
        setShowCustomPayment(false);
        setValue(`${basePath}.customPaymentText`, null);
        setValue(`${basePath}.paymentCondition`, value || null);
      }
    },
    [setValue, basePath],
  );

  const configSubtotal = config?.subtotal || 0;
  const configTotal = config?.total || 0;
  const currentCondition = config?.customPaymentText
    ? "CUSTOM"
    : config?.paymentCondition || "";

  const customerName =
    customer?.fantasyName || customer?.corporateName || "Cliente";
  const customerCnpj = customer?.cnpj;

  return (
    <FormCard
      title={customerName}
      icon="IconCreditCard"
      subtitle={customerCnpj ? `CNPJ: ${customerCnpj}` : undefined}
    >
      {/* Subtotal & Total (read-only, side by side) */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <View style={styles.labelWithIcon}>
            <IconCurrencyReal
              size={14}
              color={colors.mutedForeground}
              style={{ flexShrink: 0 }}
            />
            <ThemedText
              style={[
                styles.label,
                { color: colors.foreground, marginLeft: 4, flex: 1 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Subtotal
            </ThemedText>
          </View>
          <View
            style={[
              styles.readOnlyField,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <ThemedText
              style={{
                fontSize: fontSize.sm,
                fontWeight: "500",
                color: colors.foreground,
              }}
            >
              {formatCurrency(configSubtotal)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.halfField}>
          <View style={styles.labelWithIcon}>
            <IconCurrencyReal
              size={14}
              color={colors.primary}
              style={{ flexShrink: 0 }}
            />
            <ThemedText
              style={[
                styles.label,
                { color: colors.foreground, marginLeft: 4, flex: 1 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Valor Total
            </ThemedText>
          </View>
          <View
            style={[
              styles.readOnlyField,
              { borderColor: colors.primary, borderWidth: 2 },
            ]}
          >
            <ThemedText
              style={{
                fontSize: fontSize.lg,
                fontWeight: "700",
                color: colors.primary,
              }}
            >
              {formatCurrency(configTotal)}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Budget Responsible */}
      {taskResponsibles && taskResponsibles.length > 0 && (
        <FormFieldGroup label="Responsável do Orçamento">
          <Combobox
            value={config?.responsibleId || ""}
            onValueChange={(v) =>
              setValue(`${basePath}.responsibleId`, v || null)
            }
            options={taskResponsibles
              .filter((r: any) => !r.id.startsWith("temp-"))
              .map((r: any) => ({
                value: r.id,
                label: `${r.name} (${RESPONSIBLE_ROLE_LABELS[r.role as keyof typeof RESPONSIBLE_ROLE_LABELS] || r.role})`,
              }))}
            placeholder="Selecione o responsável"
            searchable={false}
            avoidKeyboard={false}
            onOpen={() => {}}
            onClose={() => {}}
          />
        </FormFieldGroup>
      )}

      {/* Generate Invoice Toggle */}
      <FormFieldGroup label="Emitir Nota Fiscal">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Switch
            checked={config?.generateInvoice !== false}
            onCheckedChange={(v) =>
              setValue(`${basePath}.generateInvoice`, v)
            }
          />
          <ThemedText
            style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}
          >
            {config?.generateInvoice !== false ? "Sim" : "Não"}
          </ThemedText>
        </View>
      </FormFieldGroup>

      {/* Order Number */}
      <FormFieldGroup label="Nº do Pedido">
        <View
          onLayout={
            keyboardContext
              ? (e) =>
                  keyboardContext.onFieldLayout(
                    `pricing-order-number-${configIndex}`,
                    e,
                  )
              : undefined
          }
        >
          <TextInput
            value={config?.orderNumber || ""}
            onChangeText={(t) =>
              setValue(`${basePath}.orderNumber`, t || null)
            }
            placeholder="Ex: PED-001"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.textInput,
              {
                backgroundColor: colors.input,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            onFocus={() =>
              keyboardContext?.onFieldFocus(
                `pricing-order-number-${configIndex}`,
              )
            }
          />
        </View>
      </FormFieldGroup>

      {/* Payment Condition */}
      <FormFieldGroup label="Condição de Pagamento">
        <Combobox
          value={currentCondition}
          onValueChange={handlePaymentConditionChange}
          options={PAYMENT_CONDITIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          placeholder="Selecione"
          searchable={false}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />
      </FormFieldGroup>

      {/* Custom Payment Text */}
      {showCustomPayment && (
        <FormFieldGroup label="Condições Personalizadas">
          <View
            onLayout={
              keyboardContext
                ? (e) =>
                    keyboardContext.onFieldLayout(
                      `pricing-custom-payment-${configIndex}`,
                      e,
                    )
                : undefined
            }
          >
            <TextInput
              value={config?.customPaymentText || ""}
              onChangeText={(t) =>
                setValue(`${basePath}.customPaymentText`, t || null)
              }
              placeholder="Descreva as condições de pagamento..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              onFocus={() =>
                keyboardContext?.onFieldFocus(
                  `pricing-custom-payment-${configIndex}`,
                )
              }
            />
          </View>
        </FormFieldGroup>
      )}
    </FormCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  halfField: {
    flex: 1,
    minWidth: 0,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    marginBottom: spacing.xs,
  },
  readOnlyField: {
    height: 42,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
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
});
