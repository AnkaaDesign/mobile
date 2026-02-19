import { useMemo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View, Text } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { getSuppliers } from '@/api-client';
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import { SupplierLogoDisplay } from "@/components/ui/supplier-logo-display";
import { formatCNPJ } from "@/utils";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import type { Supplier } from '@/types';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface SupplierSelectorProps {
  disabled?: boolean;
  initialSupplier?: Supplier;
}

export function SupplierSelector({ disabled, initialSupplier }: SupplierSelectorProps) {
  const { control } = useFormContext<ItemFormData>();
  const { colors } = useTheme();

  // Memoize initial options to prevent infinite loop
  const initialOptions = useMemo(
    () => initialSupplier ? [initialSupplier] : [],
    [initialSupplier?.id]
  );

  // Async search function for suppliers
  const searchSuppliers = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{
    data: Supplier[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { fantasyName: "asc" },
      page: page,
      take: 50,
      // Use select to fetch only fields needed for the combobox
      select: {
        id: true,
        fantasyName: true,
        corporateName: true,
        cnpj: true,
        logoId: true,
        logo: { select: { id: true } },
      },
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getSuppliers(params);
      return {
        data: response.data || [],
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[SupplierSelector] Error fetching suppliers:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  const getOptionLabel = useCallback((supplier: Supplier) => supplier.fantasyName, []);
  const getOptionValue = useCallback((supplier: Supplier) => supplier.id, []);

  // Custom render option with avatar and metadata
  const renderOption = useCallback(
    (option: Supplier, isSelected: boolean) => (
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
    ),
    [colors]
  );

  return (
    <Controller
      control={control}
      name="supplierId"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="supplierId" style={{ marginBottom: 4 }}>
            Fornecedor
          </Label>
          <Combobox<Supplier>
            value={value || ""}
            onValueChange={onChange}
            async={true}
            queryKey={["suppliers", "search"]}
            queryFn={searchSuppliers}
            initialOptions={initialOptions}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            renderOption={renderOption}
            placeholder="Selecione um fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            emptyText="Nenhum fornecedor encontrado"
            disabled={disabled}
            minSearchLength={0}
            pageSize={50}
            debounceMs={300}
            clearable={true}
          />
          {error && <ThemedText style={{ fontSize: 12, color: "#ef4444" }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
