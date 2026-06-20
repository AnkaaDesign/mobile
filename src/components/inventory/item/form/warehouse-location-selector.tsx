import { useMemo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View, Text } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { getWarehouseLocations } from "@/api-client";
import { useWarehouseLocationDetail } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight } from "@/constants/design-system";
import type { ItemCreateFormData, ItemUpdateFormData } from "../../../../schemas";
import type { WarehouseLocation } from "@/types";

type ItemFormData = ItemCreateFormData | ItemUpdateFormData;

interface WarehouseLocationSelectorProps {
  disabled?: boolean;
  initialWarehouseLocation?: WarehouseLocation;
}

export function WarehouseLocationSelector({ disabled, initialWarehouseLocation }: WarehouseLocationSelectorProps) {
  const { control, watch, setValue } = useFormContext<ItemFormData>();
  const { colors } = useTheme();

  // Memoize initial options to prevent infinite loop
  const initialOptions = useMemo(
    () => (initialWarehouseLocation ? [initialWarehouseLocation] : []),
    [initialWarehouseLocation?.id],
  );

  // Async search function for warehouse locations
  const searchLocations = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: WarehouseLocation[];
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
      const response = await getWarehouseLocations(params);
      return {
        data: response.data || [],
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error("[WarehouseLocationSelector] Error fetching locations:", error);
      return { data: [], hasMore: false };
    }
  }, []);

  const getOptionLabel = useCallback((location: WarehouseLocation) => location.name, []);
  const getOptionValue = useCallback((location: WarehouseLocation) => location.id, []);

  const renderOption = useCallback(
    (option: WarehouseLocation, isSelected: boolean) => (
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text
          style={{
            fontSize: fontSize.base,
            fontWeight: isSelected ? fontWeight.semibold : fontWeight.medium,
            color: colors.foreground,
          }}
          numberOfLines={1}
        >
          {option.name}
        </Text>
        {(option.section || option.code) && (
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }} numberOfLines={1}>
            {[option.section, option.code].filter(Boolean).join(" • ")}
          </Text>
        )}
      </View>
    ),
    [colors],
  );

  // Watch the chosen location id so we can fetch its grid (levels/columns/columnsPerLevel)
  const warehouseLocationId = watch("warehouseLocationId");

  const { data: locationResponse } = useWarehouseLocationDetail(warehouseLocationId || "", {
    enabled: !!warehouseLocationId,
  });
  const selectedLocation = locationResponse?.data;

  const watchedLevel = watch("locationLevel");

  // Bounded options for Nível
  const levelOptions: ComboboxOption[] = useMemo(() => {
    const levels = selectedLocation?.levels ?? 0;
    return Array.from({ length: levels }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }));
  }, [selectedLocation?.levels]);

  // Bounded options for Coluna — per-level override falls back to columns
  const columnOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedLocation) return [];
    const perLevel = selectedLocation.columnsPerLevel ?? [];
    const cols =
      watchedLevel && perLevel[Number(watchedLevel) - 1]
        ? perLevel[Number(watchedLevel) - 1]
        : selectedLocation.columns;
    return Array.from({ length: cols ?? 0 }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1),
    }));
  }, [selectedLocation, watchedLevel]);

  return (
    <View style={{ gap: 12 }}>
      <Controller
        control={control}
        name="warehouseLocationId"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={{ gap: 8 }}>
            <Label nativeID="warehouseLocationId" style={{ marginBottom: 4 }}>
              Localização
            </Label>
            <Combobox<WarehouseLocation>
              value={value || ""}
              onValueChange={(next) => {
                onChange(next || null);
                // Clear the exact cell whenever the location changes/clears
                setValue("locationLevel", null, { shouldDirty: true, shouldValidate: true });
                setValue("locationColumn", null, { shouldDirty: true, shouldValidate: true });
              }}
              async={true}
              queryKey={["warehouseLocations", "search"]}
              queryFn={searchLocations}
              initialOptions={initialOptions}
              getOptionLabel={getOptionLabel}
              getOptionValue={getOptionValue}
              renderOption={renderOption}
              placeholder="Selecione uma localização"
              searchPlaceholder="Buscar localização..."
              emptyText="Nenhuma localização encontrada"
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

      {warehouseLocationId && levelOptions.length > 0 && (
        <Controller
          control={control}
          name="locationLevel"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={{ gap: 8 }}>
              <Label nativeID="locationLevel" style={{ marginBottom: 4 }}>
                Nível
              </Label>
              <Combobox
                options={levelOptions}
                value={value != null ? String(value) : ""}
                onValueChange={(next) => {
                  onChange(next ? Number(next) : null);
                  // Column bounds depend on the level — reset on change
                  setValue("locationColumn", null, { shouldDirty: true, shouldValidate: true });
                }}
                placeholder="Selecione o nível"
                disabled={disabled}
                searchable={false}
                clearable={true}
              />
              {error && <ThemedText style={{ fontSize: 12, color: "#ef4444" }}>{error.message}</ThemedText>}
            </View>
          )}
        />
      )}

      {warehouseLocationId && columnOptions.length > 0 && (
        <Controller
          control={control}
          name="locationColumn"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={{ gap: 8 }}>
              <Label nativeID="locationColumn" style={{ marginBottom: 4 }}>
                Coluna
              </Label>
              <Combobox
                options={columnOptions}
                value={value != null ? String(value) : ""}
                onValueChange={(next) => onChange(next ? Number(next) : null)}
                placeholder="Selecione a coluna"
                disabled={disabled}
                searchable={false}
                clearable={true}
              />
              {error && <ThemedText style={{ fontSize: 12, color: "#ef4444" }}>{error.message}</ThemedText>}
            </View>
          )}
        />
      )}
    </View>
  );
}
