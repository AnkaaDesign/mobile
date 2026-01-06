import { useState, useMemo, useCallback, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";

import { getItemCategories } from "@/api-client/item-category";
import { useItemCategoryMutations } from "@/hooks";
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from "@/constants";
import type { ItemCategory } from "@/types";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface CategorySelectorProps {
  disabled?: boolean;
  required?: boolean;
  initialCategory?: ItemCategory;
  onCategoryChange?: (categoryId: string | undefined) => void;
}

export function CategorySelector({ disabled, required, initialCategory, onCategoryChange }: CategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { control } = useFormContext<ItemFormData>();
  const { createAsync } = useItemCategoryMutations();

  // Cache for category lookups
  const cacheRef = useRef<Map<string, ItemCategory>>(new Map());

  // Memoize initial options to prevent infinite loop
  const initialOptions = useMemo(
    () => initialCategory ? [initialCategory] : [],
    [initialCategory?.id]
  );

  // Async search function for categories
  const searchCategories = useCallback(async (
    search: string,
    page: number = 1
  ): Promise<{
    data: ItemCategory[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 50,
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getItemCategories(params);
      const categories = response.data || [];

      // Cache categories for onCategoryChange callback
      categories.forEach(cat => {
        cacheRef.current.set(cat.id, cat);
      });

      return {
        data: categories,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[CategorySelector] Error fetching categories:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  const getOptionLabel = useCallback(
    (category: ItemCategory) =>
      `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[category.type as keyof typeof ITEM_CATEGORY_TYPE_LABELS]})`,
    []
  );
  const getOptionValue = useCallback((category: ItemCategory) => category.id, []);

  const handleCreateCategory = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createAsync({
        name,
        type: ITEM_CATEGORY_TYPE.REGULAR,
      });

      if (result.success && result.data) {
        // Cache the new category
        cacheRef.current.set(result.data.id, result.data);
        return result.data.id;
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Controller
      control={control}
      name="categoryId"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="categoryId" style={{ marginBottom: 4 }}>
            Categoria {required && <ThemedText variant="destructive">*</ThemedText>}
          </Label>
          <Combobox<ItemCategory>
            value={value || ""}
            onValueChange={(selectedValue) => {
              // Convert empty string to null for optional field
              const newValue = selectedValue === "" ? null : selectedValue;
              onChange(newValue);

              // Find category from cache for onCategoryChange callback
              const category = selectedValue ? cacheRef.current.get(selectedValue) : undefined;
              onCategoryChange?.(category?.id || undefined);
            }}
            async={true}
            queryKey={["item-categories", "search"]}
            queryFn={searchCategories}
            initialOptions={initialOptions}
            getOptionLabel={getOptionLabel}
            getOptionValue={getOptionValue}
            placeholder="Selecione uma categoria (opcional)"
            searchPlaceholder="Buscar categoria..."
            emptyText="Nenhuma categoria encontrada"
            disabled={disabled || isCreating}
            error={error?.message}
            clearable={!required}
            minSearchLength={0}
            pageSize={50}
            debounceMs={300}
            onCreate={async (name) => {
              const newCategoryId = await handleCreateCategory(name);
              if (newCategoryId) {
                onChange(newCategoryId);
                onCategoryChange?.(newCategoryId);
              }
            }}
            createNewText={(value: string) => `Criar categoria "${value}"`}
            isCreating={isCreating}
          />
        </View>
      )}
    />
  );
}
