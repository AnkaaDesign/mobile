import React, { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { showToast } from "@/components/ui/toast";
import { useItemCategories, useItemCategoryMutations } from '../../../../hooks';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';
import { ITEM_CATEGORY_TYPE, ITEM_CATEGORY_TYPE_LABELS } from '../../../../constants';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface CategorySelectorProps {
  disabled?: boolean;
  required?: boolean;
  onCategoryChange?: (categoryId: string | undefined) => void;
}

export function CategorySelector({ disabled, required, onCategoryChange }: CategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { control } = useFormContext<ItemFormData>();

  const {
    data: categories,
    isLoading,
    refetch,
  } = useItemCategories({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const { createAsync } = useItemCategoryMutations();

  const categoryOptions =
    categories?.data?.map((category) => ({
      value: category.id,
      label: `${category.name} (${ITEM_CATEGORY_TYPE_LABELS[category.type as keyof typeof ITEM_CATEGORY_TYPE_LABELS]})`,
    })) || [];

  const handleCreateCategory = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createAsync({
        name,
        type: ITEM_CATEGORY_TYPE.REGULAR,
      });

      if (result.success && result.data) {
        // Refetch categories to update the list
        await refetch();

        // Set the newly created category as selected
        const newCategoryId = result.data.id;
        return newCategoryId;
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
            Categoria {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <Combobox
            value={value || ""}
            onValueChange={(selectedValue) => {
              // Convert empty string to null for optional field
              const newValue = selectedValue === "" ? null : selectedValue;
              onChange(newValue);
              const category = categories?.data?.find((c) => c.id === selectedValue);
              onCategoryChange?.(category?.id || undefined);
            }}
            options={categoryOptions}
            placeholder="Selecione uma categoria (opcional)"
            disabled={disabled || isCreating}
            loading={isLoading || isCreating}
            error={error?.message}
            searchable={true}
            clearable={!required}
            onCreate={async (name) => {
              const newCategoryId = await handleCreateCategory(name);
              if (newCategoryId) {
                onChange(newCategoryId);
                onCategoryChange?.(newCategoryId);
              }
            }}
            createNewText={(value) => `Criar categoria "${value}"`}
          />
        </View>
      )}
    />
  );
}
