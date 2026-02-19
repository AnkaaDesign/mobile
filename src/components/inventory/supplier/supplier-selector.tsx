import { useMemo, useCallback } from "react";
import { View, ViewStyle, Text } from "react-native";
import { getSuppliers } from '../../../api-client';
import { Combobox } from "@/components/ui/combobox";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight} from "@/constants/design-system";
import type { Supplier } from '../../../types';
import { SupplierLogoDisplay } from "@/components/ui/supplier-logo-display";
import { formatCNPJ } from "@/utils";

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
  const getOptionLabel = useCallback((supplier: Supplier) => supplier.fantasyName, []);
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
      orderBy: { fantasyName: "asc" },
      page: page,
      take: 50,
      where: { isActive: true },
      include: { logo: true },
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

  // Custom render option with avatar and CNPJ
  const renderOption = useCallback(
    (option: Supplier, isSelected: boolean) => {
      return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
          <SupplierLogoDisplay
            logo={option.logo}
            supplierName={option.fantasyName}
            size="sm"
            shape="rounded"
          />
          <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
            <Text
              style={{
                fontSize: fontSize.base,
                fontWeight: isSelected ? fontWeight.semibold : fontWeight.medium,
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {option.fantasyName}
            </Text>
            {(option.corporateName || option.cnpj) && (
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                {option.corporateName && (
                  <Text
                    style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}
                    numberOfLines={1}
                  >
                    {option.corporateName}
                  </Text>
                )}
                {option.cnpj && (
                  <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
                    {option.corporateName ? " \u2022 " : ""}{formatCNPJ(option.cnpj)}
                  </Text>
                )}
              </View>
            )}
          </View>
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
      />
    </View>
  );
}
