import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { useSuppliers } from '../../../../hooks';
import type { ItemCreateFormData, ItemUpdateFormData } from '../../../../schemas';

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface SupplierSelectorProps {
  disabled?: boolean;
}

export function SupplierSelector({ disabled }: SupplierSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { control } = useFormContext<ItemFormData>();
  const { data: suppliers, isLoading } = useSuppliers({
    searchingFor: searchQuery,
    orderBy: { fantasyName: "asc" },
  });

  const supplierOptions =
    suppliers?.data?.map((supplier) => ({
      value: supplier.id,
      label: supplier.fantasyName,
    })) || [];

  return (
    <Controller
      control={control}
      name="supplierId"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ gap: 8 }}>
          <Label nativeID="supplierId" style={{ marginBottom: 4 }}>
            Fornecedor
          </Label>
          <Combobox
            value={value || ""}
            onValueChange={onChange}
            options={supplierOptions}
            placeholder="Selecione um fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            emptyText="Nenhum fornecedor encontrado"
            onSearchChange={setSearchQuery}
            disabled={disabled || isLoading}
          />
          {error && <ThemedText style={{ fontSize: 12, color: "#ef4444" }}>{error.message}</ThemedText>}
        </View>
      )}
    />
  );
}
