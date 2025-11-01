import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";

import { useItemBrands, useItemBrandMutations } from '../../../../hooks';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface BrandSelectorProps {
  disabled?: boolean;
  required?: boolean;
}

export function BrandSelector({ disabled, required }: BrandSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { control } = useFormContext<ItemFormData>();

  const {
    data: brands,
    isLoading,
    refetch,
  } = useItemBrands({
    orderBy: { name: "asc" },
    limit: 100,
  });

  const { createAsync } = useItemBrandMutations();

  const brandOptions =
    brands?.data?.map((brand) => ({
      value: brand.id,
      label: brand.name,
    })) || [];

  const handleCreateBrand = async (name: string) => {
    setIsCreating(true);
    try {
      const result = await createAsync({
        name,
      });

      if (result.success && result.data) {
        // Refetch brands to update the list
        await refetch();

        // Return the newly created brand ID
        return result.data.id;
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Controller
      control={control}
      name="brandId"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="brandId" style={{ marginBottom: 4 }}>
            Marca {required && <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>}
          </Label>
          <Combobox
            value={value ?? undefined}
            onValueChange={onChange}
            options={brandOptions}
            placeholder="Selecione uma marca"
            disabled={disabled || isCreating}
            loading={isLoading || isCreating}
            error={error?.message}
            searchable={true}
            clearable={!required}
            onCreate={async (name) => {
              const newBrandId = await handleCreateBrand(name);
              if (newBrandId) {
                onChange(newBrandId);
              }
            }}
            createNewText={(value) => `Criar marca "${value}"`}
          />
        </View>
      )}
    />
  );
}
