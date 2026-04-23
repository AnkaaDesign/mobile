import { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { useWatch, useFormContext } from "react-hook-form";
import { IconCurrencyReal } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FormCard, FormFieldGroup } from "@/components/ui/form-section";
import { useTheme } from "@/lib/theme";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";
import {
  PRESET_CONFIGS,
  CASH_DAYS_OPTIONS,
  INSTALLMENT_STEP_OPTIONS,
  ENTRY_DAYS_OPTIONS,
} from "@/constants/budget-billing";

const PAYMENT_TYPE_OPTIONS = [
  { value: "CASH",   label: "À vista"      },
  { value: "INST_2", label: "Parcelado 2x" },
  { value: "INST_3", label: "Parcelado 3x" },
  { value: "INST_4", label: "Parcelado 4x" },
  { value: "INST_5", label: "Parcelado 5x" },
  { value: "INST_6", label: "Parcelado 6x" },
];
import { RESPONSIBLE_ROLE_LABELS } from "@/types/responsible";
import { formatCurrency } from "@/utils";
import type { PaymentConfig } from "@/schemas/task-quote";

function legacyToConfig(condition: string | null | undefined): PaymentConfig | null {
  if (!condition || condition === "CUSTOM") return null;
  if (condition === "CASH_5")  return { type: "CASH", cashDays: 5 };
  if (condition === "CASH_40") return { type: "CASH", cashDays: 40 };
  const m = condition.match(/^INSTALLMENTS_(\d+)$/);
  if (m) return { type: "INSTALLMENTS", installmentCount: Number(m[1]), installmentStep: 20, entryDays: 5 };
  return null;
}

function configToTypeValue(config: PaymentConfig | null | undefined): string {
  if (!config) return "";
  if (config.type === "CASH") return "CASH";
  if (config.type === "INSTALLMENTS") return `INST_${config.installmentCount}`;
  return "";
}

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
  const basePath = `${fieldPrefix}customerConfigs.${configIndex}`;

  const config = useWatch({ control, name: basePath });

  // Effective payment config: prefer new paymentConfig, fall back to legacy paymentCondition
  const paymentConfig: PaymentConfig | null =
    config?.paymentConfig ?? legacyToConfig(config?.paymentCondition);

  const typeValue = configToTypeValue(paymentConfig);
  const paymentType = paymentConfig?.type ?? null;
  const useSpecificDate = !!paymentConfig?.specificDate;

  // Default budget responsible to the first non-temp task responsible on mount
  const hasAutoDefaulted = useRef(false);
  useEffect(() => {
    if (hasAutoDefaulted.current) return;
    if (taskResponsibles && taskResponsibles.length > 0 && !config?.responsibleId) {
      hasAutoDefaulted.current = true;
      const firstValid = taskResponsibles.find((r) => !r.id.startsWith("temp-"));
      if (firstValid) {
        setValue(`${basePath}.responsibleId`, firstValid.id, { shouldDirty: false });
      }
    }
  }, [taskResponsibles, config?.responsibleId, setValue, basePath]);

  const setPaymentConfig = useCallback(
    (next: PaymentConfig | null) => {
      setValue(`${basePath}.paymentConfig`, next, { shouldDirty: true });
      setValue(`${basePath}.paymentCondition`, null);
    },
    [setValue, basePath],
  );

  const patch = useCallback(
    (partial: Partial<PaymentConfig>) => {
      setPaymentConfig({ ...(paymentConfig as PaymentConfig), ...partial } as PaymentConfig);
    },
    [setPaymentConfig, paymentConfig],
  );

  const handleTypeChange = useCallback(
    (val: string | null) => {
      if (!val) { setPaymentConfig(null); return; }
      if (val === "CASH") {
        setPaymentConfig({ type: "CASH", cashDays: paymentConfig?.cashDays ?? 5 });
        return;
      }
      const m = val.match(/^INST_(\d+)$/);
      if (m) {
        setPaymentConfig({
          type: "INSTALLMENTS",
          installmentCount: Number(m[1]),
          installmentStep: paymentConfig?.installmentStep ?? 20,
          entryDays: paymentConfig?.entryDays ?? 5,
        });
      }
    },
    [setPaymentConfig, paymentConfig],
  );

  const configSubtotal = config?.subtotal || 0;
  const configTotal = config?.total || 0;

  const customerName = customer?.fantasyName || customer?.corporateName || "Cliente";
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
            <IconCurrencyReal size={14} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
            <ThemedText
              style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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
            <ThemedText
              style={[styles.label, { color: colors.foreground, marginLeft: 4, flex: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
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

      {/* Budget Responsible */}
      {taskResponsibles && taskResponsibles.length > 0 && (
        <FormFieldGroup label="Responsável do Orçamento">
          <Combobox
            value={config?.responsibleId || ""}
            onValueChange={(v) => setValue(`${basePath}.responsibleId`, v || null)}
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

      {/* Generate Invoice Toggle — label + helper on the left, switch on the right */}
      <View
        style={[
          styles.toggleRow,
          { borderColor: colors.border, backgroundColor: colors.muted + "20" },
        ]}
      >
        <View style={styles.toggleTextColumn}>
          <ThemedText style={[styles.toggleTitle, { color: colors.foreground }]}>
            Emitir Nota Fiscal
          </ThemedText>
          <ThemedText
            style={[styles.toggleHelper, { color: colors.mutedForeground }]}
          >
            {config?.generateInvoice !== false
              ? "Será gerada uma nota fiscal para este cliente."
              : "Nenhuma nota fiscal será gerada para este cliente."}
          </ThemedText>
        </View>
        <Switch
          checked={config?.generateInvoice !== false}
          onCheckedChange={(v) => setValue(`${basePath}.generateInvoice`, v)}
        />
      </View>

      {/* Order Number */}
      <FormFieldGroup label="Nº do Pedido">
        <View
          onLayout={
            keyboardContext
              ? (e) => keyboardContext.onFieldLayout(`pricing-order-number-${configIndex}`, e)
              : undefined
          }
        >
          <TextInput
            value={config?.orderNumber || ""}
            onChangeText={(t) => setValue(`${basePath}.orderNumber`, t || null)}
            placeholder="Ex: PED-001"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.textInput,
              { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
            ]}
            onFocus={() => keyboardContext?.onFieldFocus(`pricing-order-number-${configIndex}`)}
          />
        </View>
      </FormFieldGroup>

      {/* Payment Config */}
      <FormFieldGroup label="Condição de Pagamento">
        {/* Type selector */}
        <Combobox
          value={typeValue}
          onValueChange={handleTypeChange}
          options={PAYMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          placeholder="Selecione..."
          searchable={false}
          avoidKeyboard={false}
          onOpen={() => {}}
          onClose={() => {}}
        />

        {/* À Vista: Vencimento */}
        {paymentType === "CASH" && (
          <View style={{ marginTop: spacing.sm }}>
            <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>Vencimento</ThemedText>
            <Combobox
              value={paymentConfig?.specificDate ? "CUSTOM" : String(paymentConfig?.cashDays ?? "")}
              onValueChange={(v) => {
                if (!v) { patch({ cashDays: undefined, specificDate: undefined }); return; }
                if (v === "CUSTOM") { patch({ specificDate: "" }); return; }
                patch({ cashDays: Number(v) as any, specificDate: undefined });
              }}
              options={[
                ...CASH_DAYS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                { value: "CUSTOM", label: "Personalizado" },
              ]}
              placeholder="Dias..."
              searchable={false}
              avoidKeyboard={false}
              onOpen={() => {}}
              onClose={() => {}}
            />
          </View>
        )}

        {/* Parcelado: step + entry */}
        {paymentType === "INSTALLMENTS" && (
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <View style={styles.halfField}>
              <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>Intervalo</ThemedText>
              <Combobox
                value={String(paymentConfig?.installmentStep ?? 20)}
                onValueChange={(v) => patch({ installmentStep: Number(v) })}
                options={INSTALLMENT_STEP_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                placeholder="Intervalo..."
                searchable={false}
                avoidKeyboard={false}
                onOpen={() => {}}
                onClose={() => {}}
              />
            </View>
            <View style={styles.halfField}>
              <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>Entrada</ThemedText>
              <Combobox
                value={paymentConfig?.specificDate ? "CUSTOM" : String(paymentConfig?.entryDays ?? 5)}
                onValueChange={(v) => {
                  if (!v) { patch({ entryDays: undefined, specificDate: undefined }); return; }
                  if (v === "CUSTOM") { patch({ specificDate: "" }); return; }
                  patch({ entryDays: Number(v), specificDate: undefined });
                }}
                options={[
                  ...ENTRY_DAYS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                  { value: "CUSTOM", label: "Personalizado" },
                ]}
                placeholder="5 dias..."
                searchable={false}
                avoidKeyboard={false}
                onOpen={() => {}}
                onClose={() => {}}
              />
            </View>
          </View>
        )}

        {/* Specific date — only shown when Personalizado is chosen */}
        {paymentType && paymentConfig?.specificDate !== undefined && (
          <View style={{ marginTop: spacing.sm }}>
            <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
              {paymentConfig.specificDate ? "Data específica (ativo)" : "Data específica (AAAA-MM-DD)"}
            </ThemedText>
            <TextInput
              value={paymentConfig.specificDate ?? ""}
              onChangeText={(t) => patch({ specificDate: t.trim() || "" })}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.input,
                  borderColor: paymentConfig.specificDate ? colors.primary : colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>
        )}
      </FormFieldGroup>
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
  // Entry date section
  entrySection: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  entrySectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  subLabel: {
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  // Emitir Nota Fiscal toggle row (label/helper + switch on the right)
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  toggleTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  toggleTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  toggleHelper: {
    fontSize: 11,
    marginTop: 2,
  },
});
