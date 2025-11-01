import { useState, useEffect } from "react";
import { View, ViewStyle, ActivityIndicator } from "react-native";
import { useSuppliers } from '../../../hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import type { Supplier } from '../../../types';

interface SupplierSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: ViewStyle;
}

export function SupplierSelector({
  value,
  onValueChange,
  placeholder = "Selecione um fornecedor",
  disabled = false,
  required = false,
  style,
}: SupplierSelectorProps) {
  const { colors, spacing } = useTheme();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { data, isLoading } = useSuppliers({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const suppliers = data?.data || [];

  useEffect(() => {
    if (value && suppliers.length > 0) {
      const supplier = suppliers.find((s) => s.id === value);
      setSelectedSupplier(supplier || null);
    }
  }, [value, suppliers]);

  const handleChange = (newValue: string) => {
    const supplier = suppliers.find((s) => s.id === newValue);
    setSelectedSupplier(supplier || null);
    onValueChange?.(newValue);
  };

  if (isLoading) {
    return (
      <View
        style={[
          {
            padding: spacing.md,
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={style}>
      <Select value={value || ""} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {selectedSupplier ? (
              <ThemedText numberOfLines={1}>{selectedSupplier.name}</ThemedText>
            ) : (
              <ThemedText variant="muted" numberOfLines={1}>
                {placeholder}
              </ThemedText>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value="">
              <ThemedText variant="muted">Nenhum</ThemedText>
            </SelectItem>
          )}
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              <View>
                <ThemedText weight="medium">{supplier.name}</ThemedText>
                {supplier.cnpj && (
                  <ThemedText size="xs" variant="muted">
                    CNPJ: {supplier.cnpj}
                  </ThemedText>
                )}
              </View>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </View>
  );
}