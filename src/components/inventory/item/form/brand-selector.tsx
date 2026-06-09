import { useState, useMemo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";

import { getItemBrands } from '@/api-client/item-brand';
import { useItemBrandMutations } from '../../../../hooks';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import type { ItemBrand } from '@/types';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface BrandSelectorProps {
  disabled?: boolean;
  required?: boolean;
  initialBrands?: ItemBrand[];
}

export function BrandSelector({ disabled, required, initialBrands }: BrandSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { control } = useFormContext<ItemFormData>();
  const { createAsync } = useItemBrandMutations();

  // Memoize initial options to prevent infinite loop
  const initialOptions = useMemo(
    () => initialBrands ?? [],
    [initialBrands]
  );

  // Async search function for brands
  const searchBrands = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{
    data: ItemBrand[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 50,
      // Use select to fetch only fields needed for the combobox
      select: {
        id: true,
        name: true,
      },
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getItemBrands(params);
      return {
        data: response.data || [],
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[BrandSelector] Error fetching brands:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  const getOptionLabel = useCallback((brand: ItemBrand) => brand.name, []);
  const getOptionValue = useCallback((brand: ItemBrand) => brand.id, []);

  const handleCreateBrand = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createAsync({ name });

      if (result.success && result.data) {
        return result.data.id;
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Controller
      control={control}
      name="brandIds"
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedIds = Array.isArray(value) ? value : [];
        return (
          <View style={{ gap: 8 }}>
            <Label nativeID="brandIds" style={{ marginBottom: 4 }}>
              Marcas {required && <ThemedText variant="destructive">*</ThemedText>}
            </Label>
            <Combobox<ItemBrand>
              mode="multiple"
              value={selectedIds}
              onValueChange={(next) => onChange(Array.isArray(next) ? next : next ? [next] : [])}
              async={true}
              queryKey={["item-brands", "search"]}
              queryFn={searchBrands}
              initialOptions={initialOptions}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              placeholder="Selecione as marcas"
              searchPlaceholder="Buscar marca..."
              emptyText="Nenhuma marca encontrada"
              disabled={disabled || isCreating}
              error={error?.message}
              clearable={!required}
              minSearchLength={0}
              pageSize={50}
              debounceMs={300}
              showCount
              onCreate={async (name) => {
                const newBrandId = await handleCreateBrand(name);
                if (newBrandId && !selectedIds.includes(newBrandId)) {
                  onChange([...selectedIds, newBrandId]);
                }
              }}
              createLabel={(value: string) => `Criar marca "${value}"`}
              isCreating={isCreating}
            />
          </View>
        );
      }}
    />
  );
}
