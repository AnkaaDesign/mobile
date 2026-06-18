import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ThemedText } from "@/components/ui/themed-text";
import { spacing, fontSize } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

// Boleto payment scheduling — flexible like the task quote:
//  • Parcelas (installmentCount)
//  • Primeiro Vencimento (paymentFirstDueDate) — presets in days OR an exact date
//  • Intervalo entre Parcelas (paymentDueDays) — spacing, only for 2x+

const FIRST_DUE_PRESETS = [
  { label: "15 dias", value: "15" },
  { label: "30 dias", value: "30" },
  { label: "45 dias", value: "45" },
  { label: "60 dias", value: "60" },
  { label: "90 dias", value: "90" },
  { label: "120 dias", value: "120" },
  { label: "Personalizado", value: "CUSTOM" },
];

const INTERVAL_PRESETS = [
  { label: "15 dias", value: "15" },
  { label: "20 dias", value: "20" },
  { label: "30 dias", value: "30" },
  { label: "45 dias", value: "45" },
  { label: "60 dias", value: "60" },
];

/** A date `days` from now, anchored at 13:00 (matches forecast convention). */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(13, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

interface BoletoPaymentFieldsProps {
  installmentCount: number | null | undefined;
  paymentFirstDueDate: Date | null | undefined;
  paymentDueDays: number | null | undefined;
  onChange: (field: any, value: any) => void;
  disabled?: boolean;
}

export function BoletoPaymentFields({
  installmentCount,
  paymentFirstDueDate,
  paymentDueDays,
  onChange,
  disabled,
}: BoletoPaymentFieldsProps) {
  const { colors } = useTheme();
  const count = installmentCount || 1;
  const [firstDueMode, setFirstDueMode] = useState<string>(() => (paymentFirstDueDate ? "CUSTOM" : ""));
  const showDate = firstDueMode === "CUSTOM";

  return (
    <>
      {/* Parcelas */}
      <View style={styles.fieldGroup}>
        <Label>Parcelas</Label>
        <Combobox
          value={String(count)}
          onValueChange={(v) => {
            const s = Array.isArray(v) ? v[0] : v;
            onChange("installmentCount", s ? parseInt(s) : 1);
          }}
          options={Array.from({ length: 12 }, (_, i) => ({
            value: (i + 1).toString(),
            label: i === 0 ? "À vista (1x)" : `${i + 1}x`,
          }))}
          placeholder="Selecione as parcelas"
          disabled={disabled}
        />
      </View>

      {/* Primeiro Vencimento — presets or exact date */}
      <View style={styles.fieldGroup}>
        <Label>{count > 1 ? "1º Vencimento" : "Vencimento"}</Label>
        <Combobox
          value={firstDueMode}
          onValueChange={(v) => {
            const s = (Array.isArray(v) ? v[0] : v) || "";
            if (!s) {
              setFirstDueMode("");
              onChange("paymentFirstDueDate", null);
              return;
            }
            if (s === "CUSTOM") {
              setFirstDueMode("CUSTOM");
              return;
            }
            setFirstDueMode(s);
            onChange("paymentFirstDueDate", daysFromNow(parseInt(s)));
          }}
          options={FIRST_DUE_PRESETS}
          placeholder="Selecione o vencimento"
          disabled={disabled}
          clearable
        />
      </View>

      {/* Exact date — when Personalizado */}
      {showDate && (
        <View style={styles.fieldGroup}>
          <Label>Data do 1º Vencimento</Label>
          <DateTimePicker
            value={paymentFirstDueDate ?? undefined}
            onChange={(d) => onChange("paymentFirstDueDate", d ?? null)}
            mode="date"
            placeholder="Selecione a data"
            minimumDate={new Date()}
            disabled={disabled}
          />
        </View>
      )}

      {/* Intervalo entre parcelas — only for 2x+ */}
      {count > 1 && (
        <View style={styles.fieldGroup}>
          <Label>Intervalo entre Parcelas</Label>
          <Combobox
            value={paymentDueDays ? String(paymentDueDays) : "30"}
            onValueChange={(v) => {
              const s = Array.isArray(v) ? v[0] : v;
              onChange("paymentDueDays", s ? parseInt(s) : 30);
            }}
            options={INTERVAL_PRESETS}
            placeholder="Intervalo"
            disabled={disabled}
          />
          <ThemedText style={[styles.helpText, { color: colors.mutedForeground }]}>
            Dias entre cada parcela do boleto
          </ThemedText>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  helpText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
