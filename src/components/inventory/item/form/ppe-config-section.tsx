import React from "react";
import { View, StyleSheet} from "react-native";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PpeSizeSelector } from "./ppe-size-selector";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS } from '../../../../constants';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { spacing } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface PpeConfigSectionProps {
  disabled?: boolean;
  required?: boolean;
}

export function PpeConfigSection({ disabled, required }: PpeConfigSectionProps) {
  const { control, setValue } = useFormContext<ItemFormData>();

  // Watch the PPE type for the single configuration
  const ppeType = useWatch({
    control,
    name: "ppeType",
  });

  // Clear size when PPE type changes
  const prevPpeTypeRef = React.useRef(ppeType);
  React.useEffect(() => {
    if (prevPpeTypeRef.current && prevPpeTypeRef.current !== ppeType) {
      // PPE type changed, clear the size
      setValue("ppeSize", null);
    }
    prevPpeTypeRef.current = ppeType;
  }, [ppeType, setValue]);

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

      {/* Type and Size */}
      <View style={styles.fieldRow}>
        <Controller
          control={control}
          name={"ppeType" as const}
          render={({ field: { onChange, value }, fieldState: { error } }) => {
            const ppeTypeOptions: ComboboxOption[] = Object.entries(PPE_TYPE_LABELS).map(([key, label]) => ({
              value: key,
              label: label,
            }));

            return (
              <View style={StyleSheet.flatten([styles.field, styles.halfField])}>
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

        <View style={StyleSheet.flatten([styles.field, styles.halfField])}>
          <PpeSizeSelector ppeType={ppeType ?? undefined} disabled={disabled || !ppeType} required={required} name="ppeSize" />
        </View>
      </View>

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

        <Controller
          control={control}
          name={"ppeAutoOrderMonths" as const}
          render={({ field: { onChange, value, onBlur }, fieldState: { error } }) => (
            <View style={StyleSheet.flatten([styles.field, styles.halfField])}>
              <ThemedText style={styles.label}>Meses para Auto-pedido {required && <ThemedText variant="destructive">*</ThemedText>}</ThemedText>
              <Input
                value={value?.toString() || ""}
                onChangeText={(text) => onChange(text ? parseInt(text) : undefined)}
                onBlur={onBlur}
                placeholder="Ex: 2"
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
        <ThemedText style={styles.infoText}>Configure as informações específicas para controle de EPI. O sistema gerenciará entregas e pedidos automaticamente.</ThemedText>
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
