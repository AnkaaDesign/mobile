import React from "react";
import { View, StyleSheet} from "react-native";
import { Controller, useFormContext } from "react-hook-form";
import { ThemedText } from "@/components/ui/themed-text";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { PPE_TYPE_LABELS, PPE_DELIVERY_MODE_LABELS } from "@/constants";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { spacing } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface PpeConfigSectionProps {
  disabled?: boolean;
  required?: boolean;
}

export function PpeConfigSection({ disabled, required }: PpeConfigSectionProps) {
  const { control } = useFormContext<ItemFormData>();

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
