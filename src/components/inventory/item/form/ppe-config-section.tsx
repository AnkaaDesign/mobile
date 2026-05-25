import React from "react";
import { View, StyleSheet} from "react-native";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS, PPE_TYPE, MEASURE_TYPE, MEASURE_UNIT } from "@/constants";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { spacing } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import { PpeSizeSelector } from "./ppe-size-selector";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

// Letter sizes (P, M, G, GG, XG) are stored in the measure's `unit` field.
// Numeric sizes (SIZE_35, SIZE_36, ...) are stored in the measure's `value` field.
const LETTER_SIZES = ["P", "M", "G", "GG", "XG"];

// Convert a PPE size enum string (e.g. "SIZE_42") to its numeric value (42).
function ppeSizeToNumeric(size: string): number | null {
  const match = size.match(/^SIZE_(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return null;
}

// Convert a numeric value (42) back to a PPE size enum string ("SIZE_42").
function numericToPpeSize(value: number): string {
  return `SIZE_${value}`;
}

interface PpeConfigSectionProps {
  disabled?: boolean;
  required?: boolean;
}

export function PpeConfigSection({ disabled, required }: PpeConfigSectionProps) {
  const form = useFormContext<ItemFormData>();
  const { control, setValue, getValues } = form;

  const ppeType = useWatch({ control, name: "ppeType" });
  const measures = useWatch({ control, name: "measures" });

  // Derive the current PPE size from the SIZE measure in the measures array.
  const getCurrentPpeSize = (): string | null => {
    if (!measures || !Array.isArray(measures)) return null;
    const sizeMeasure = measures.find((m: any) => m.measureType === MEASURE_TYPE.SIZE);
    if (!sizeMeasure) return null;

    // Letter size stored in unit
    if (sizeMeasure.unit && LETTER_SIZES.includes(sizeMeasure.unit)) {
      return sizeMeasure.unit;
    }
    // Numeric size stored in value
    if (sizeMeasure.value !== null && sizeMeasure.value !== undefined) {
      return numericToPpeSize(sizeMeasure.value);
    }
    return null;
  };

  // Write the PPE size into the measures array (replacing any existing SIZE measure).
  const setPpeSize = (newSize: string | null) => {
    const currentMeasures = (getValues("measures") as any[]) || [];
    const otherMeasures = currentMeasures.filter((m: any) => m.measureType !== MEASURE_TYPE.SIZE);

    if (newSize) {
      const sizeMeasure: any = { measureType: MEASURE_TYPE.SIZE };

      if (LETTER_SIZES.includes(newSize)) {
        // Letter size -> store in unit, value is null
        sizeMeasure.value = null;
        sizeMeasure.unit = newSize as MEASURE_UNIT;
      } else {
        // Numeric size -> store in value, unit is null
        const numericValue = ppeSizeToNumeric(newSize);
        if (numericValue !== null) {
          sizeMeasure.value = numericValue;
          sizeMeasure.unit = null;
        }
      }

      if (sizeMeasure.value !== undefined || sizeMeasure.unit !== undefined) {
        setValue("measures", [...otherMeasures, sizeMeasure] as any, { shouldDirty: true, shouldValidate: true });
      }
    } else {
      setValue("measures", otherMeasures as any, { shouldDirty: true, shouldValidate: true });
    }
  };

  // Clear the size when the PPE type changes (sizes are type-specific), mirroring web.
  const prevPpeTypeRef = React.useRef(ppeType);
  React.useEffect(() => {
    if (prevPpeTypeRef.current && prevPpeTypeRef.current !== ppeType) {
      setPpeSize(null);
    }
    prevPpeTypeRef.current = ppeType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ppeType]);

  const sizeRequired = required && !!ppeType && ppeType !== PPE_TYPE.OTHERS;

  return (
    <View style={styles.fieldGroup}>
      {/* CA Input */}
      <Controller
        control={control}
        name={"ppeCA" as const}
        render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
          <View style={styles.field}>
            <ThemedText style={styles.label}>Certificado de Aprovação (CA)</ThemedText>
            <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Digite o número do CA" keyboardType="numeric" editable={!disabled} error={!!error} />
            {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
          </View>
        )}
      />

      {/* Type */}
      <Controller
        control={control}
        name={"ppeType" as const}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const ppeTypeOptions: ComboboxOption[] = Object.entries(PPE_TYPE_LABELS).map(([key, label]) => ({
            value: key,
            label: label,
          }));

          return (
            <View style={styles.field}>
              <ThemedText style={styles.label}>Tipo de EPI {required && <ThemedText variant="destructive">*</ThemedText>}</ThemedText>
              <Combobox
                options={ppeTypeOptions}
                value={value || ""}
                onValueChange={onChange}
                placeholder="Selecione o tipo de EPI"
                disabled={disabled}
                searchable={false}
                clearable={!required}
              />
              {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            </View>
          );
        }}
      />

      {/* Size - stored inside the measures array as a SIZE measure (web parity) */}
      <PpeSizeSelector
        ppeType={(ppeType as PPE_TYPE) ?? undefined}
        disabled={disabled || !ppeType}
        required={sizeRequired}
        value={getCurrentPpeSize()}
        onValueChange={setPpeSize}
      />

      {/* Delivery Configuration */}
      <Controller
        control={control}
        name={"ppeDeliveryMode" as const}
        render={({ field: { onChange, value }, fieldState: { error } }) => {
          const deliveryModeOptions: ComboboxOption[] = Object.entries(PPE_DELIVERY_MODE_LABELS).map(([key, label]) => ({
            value: key,
            label: label,
          }));

          return (
            <View style={styles.field}>
              <ThemedText style={styles.label}>Modo de Entrega {required && <ThemedText variant="destructive">*</ThemedText>}</ThemedText>
              <Combobox
                options={deliveryModeOptions}
                value={value || ""}
                onValueChange={onChange}
                placeholder="Selecione o modo de entrega"
                disabled={disabled}
                searchable={false}
                clearable={!required}
              />
              {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            </View>
          );
        }}
      />

      <View style={styles.fieldRow}>
        <Controller
          control={control}
          name={"ppeStandardQuantity" as const}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <View style={StyleSheet.flatten([styles.field, styles.halfField])}>
              <ThemedText style={styles.label}>Quantidade Padrão {required && <ThemedText variant="destructive">*</ThemedText>}</ThemedText>
              <Input
                value={value?.toString() || ""}
                onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                onBlur={onBlur}
                placeholder="Ex: 1"
                keyboardType="numeric"
                editable={!disabled}
                error={!!error}
              />
              {error && <ThemedText style={styles.errorText}>{error.message}</ThemedText>}
            </View>
          )}
        />

      </View>

      <View style={styles.infoBox}>
        <ThemedText style={styles.infoText}>Configure as informações específicas para controle de EPI. O sistema gerenciará entregas automaticamente.</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  required: {
    color: "#dc2626",
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: extendedColors.info.dark,
    lineHeight: 18,
  },
});
