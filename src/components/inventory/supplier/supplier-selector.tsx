import { useMemo, useCallback } from "react";
import { View, ViewStyle, Text } from "react-native";
import { getSuppliers } from '../../../api-client';
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, spacing } from "@/constants/design-system";
import type { Supplier } from '../../../types';

interface SupplierSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  initialSupplier?: Supplier;
  style?: ViewStyle;
}

export function SupplierSelector({
  value,
  onValueChange,
  placeholder = "Selecione um fornecedor",
  disabled = false,
  required = false,
  label = "Fornecedor",
  error,
  initialSupplier,
  style,
}: SupplierSelectorProps) {
  const { colors } = useTheme();

  // Create initialOptions from the initial supplier for edit forms
  const initialOptions = useMemo(
    () => initialSupplier ? [initialSupplier] : [],
    [initialSupplier?.id]
  );

  // Memoize callbacks to prevent infinite loops
  const getOptionLabel = useCallback((supplier: Supplier) => supplier.name, []);
  const getOptionValue = useCallback((supplier: Supplier) => supplier.id, []);

  // Search function for async loading
  const searchSuppliers = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Supplier[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 50,
      where: { isActive: true },
    };

    // Only add search filter if there's a search term
    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getSuppliers(params);
      const suppliers = response.data || [];
      const hasMore = response.meta?.hasNextPage || false;

      return {
        data: suppliers,
        hasMore: hasMore,
      };
    } catch (error) {
      console.error('[SupplierSelector] Error fetching suppliers:', error);
      return { data: [], hasMore: false };
    }
  };

  // Custom render option with CNPJ
  const renderOption = useCallback(
    (option: Supplier, isSelected: boolean) => {
      return (
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: fontSize.base,
              fontWeight: isSelected ? fontWeight.semibold : fontWeight.medium,
              color: colors.foreground,
            }}
          >
            {option.name}
          </Text>
          {option.cnpj && (
            <Text
              style={{
                fontSize: fontSize.xs,
                color: colors.mutedForeground,
                marginTop: 2,
              }}
            >
              CNPJ: {option.cnpj}
            </Text>
          )}
        </View>
      );
    },
    [colors]
  );

  return (
    <View style={style}>
      <Combobox<Supplier>
        value={value || ""}
        onValueChange={(newValue) => {
          onValueChange?.(newValue as string | undefined);
        }}
        placeholder={placeholder}
        label={required ? `${label} *` : label}
        error={error}
        disabled={disabled}
        async={true}
        queryKey={["suppliers", "selector"]}
        queryFn={searchSuppliers}
        initialOptions={initialOptions}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        renderOption={renderOption}
        clearable={!required}
        minSearchLength={0}
        pageSize={50}
        debounceMs={300}
        preferFullScreen={true}
      />
    </View>
  );
}
