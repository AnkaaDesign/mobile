import { useCallback } from "react";
import { View } from "react-native";
import { Input } from "@/components/ui";
import { FormFieldGroup } from "@/components/ui/form-section";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";

interface ColumnsPerLevelEditorProps {
  /** Number of levels (níveis) configured for the location. */
  levels: number;
  /** Fallback column count when a level has no explicit override. */
  defaultColumns: number;
  /** Current per-level column counts (index 0 = nível 1). */
  value?: number[];
  onChange: (next: number[] | undefined) => void;
  disabled?: boolean;
}

/**
 * Optional per-nível column override. Renders one number input per nível.
 * When every entry matches the uniform `defaultColumns`, we emit `undefined`
 * so the location falls back to its single `columns` value (keeps payload minimal).
 */
export function ColumnsPerLevelEditor({ levels, defaultColumns, value, onChange, disabled }: ColumnsPerLevelEditorProps) {
  const { colors } = useTheme();
  const safeLevels = Math.max(0, Math.min(100, Math.floor(levels || 0)));

  const resolveAt = useCallback(
    (index: number) => {
      const explicit = value?.[index];
      return explicit != null ? explicit : defaultColumns;
    },
    [value, defaultColumns],
  );

  const handleChange = useCallback(
    (index: number, raw: string) => {
      const parsed = raw === "" ? defaultColumns : Number(raw.replace(/[^0-9]/g, "")) || defaultColumns;
      const next = Array.from({ length: safeLevels }, (_, i) => (i === index ? parsed : resolveAt(i)));
      // Collapse back to uniform → undefined (fall back to `columns`)
      const allUniform = next.every((c) => c === defaultColumns);
      onChange(allUniform ? undefined : next);
    },
    [safeLevels, defaultColumns, resolveAt, onChange],
  );

  if (safeLevels <= 1) {
    return null;
  }

  return (
    <FormFieldGroup label="Colunas por Nível (opcional)">
      <ThemedText style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: 8 }}>
        Defina um número de colunas diferente para cada nível. Em branco usa o valor padrão de Colunas.
      </ThemedText>
      <View style={{ gap: 8 }}>
        {Array.from({ length: safeLevels }, (_, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ThemedText style={{ width: 72, fontSize: 13, color: colors.foreground }}>{`Nível ${i + 1}`}</ThemedText>
            <View style={{ flex: 1 }}>
              <Input
                value={String(resolveAt(i))}
                onChangeText={(text) => handleChange(i, text)}
                placeholder={String(defaultColumns)}
                keyboardType="number-pad"
                editable={!disabled}
              />
            </View>
          </View>
        ))}
      </View>
    </FormFieldGroup>
  );
}
