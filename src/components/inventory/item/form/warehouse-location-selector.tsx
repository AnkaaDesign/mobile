import { useMemo, useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { View, Text } from "react-native";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { ThemedText } from "@/components/ui/themed-text";
import { getWarehouseLocations } from "@/api-client";
import { useWarehouseLocationDetail } from "@/hooks";
import { WAREHOUSE_LOCATION_TYPE } from "@/constants";
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

  const isKanban = selectedLocation?.type === WAREHOUSE_LOCATION_TYPE.ESTANTE_KANBAN;
  const isPanel = selectedLocation?.type === WAREHOUSE_LOCATION_TYPE.PAINEL;
  const levelLabel = isPanel ? "Linha" : "Prateleira";

  // Selectable cells: one option per prateleira (estante/painel) or per
  // prateleira×caixa (kanban). Tokens: "<level>" or "<level>:<column>".
  const cellOptions: ComboboxOption[] = useMemo(() => {
    if (!selectedLocation) return [];
    const levels = selectedLocation.levels ?? 0;
    const perLevel = selectedLocation.columnsPerLevel ?? [];
    const opts: ComboboxOption[] = [];
    for (let lvl = 1; lvl <= levels; lvl++) {
      if (isKanban) {
        const cols = (perLevel[lvl - 1] || selectedLocation.columns) ?? 0;
        for (let col = 1; col <= cols; col++) opts.push({ value: `${lvl}:${col}`, label: `Prateleira ${lvl} · Caixa ${col}` });
      } else {
        opts.push({ value: String(lvl), label: `${levelLabel} ${lvl}` });
      }
    }
    return opts;
  }, [selectedLocation, isKanban, levelLabel]);

  // Form value (cells) <-> combobox tokens.
  const locationCells = watch("locationCells");
  const selectedTokens = useMemo(
    () => (locationCells ?? []).map((c) => (c.column != null ? `${c.level}:${c.column}` : String(c.level))),
    [locationCells],
  );
  const handleCellsChange = (next: string | string[] | null | undefined) => {
    const tokens = Array.isArray(next) ? next : next ? [next] : [];
    const cells = tokens.map((t) => {
      const [l, c] = String(t).split(":");
      return { level: Number(l), column: c != null ? Number(c) : null };
    });
    setValue("locationCells", cells, { shouldDirty: true, shouldValidate: true });
  };

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
                // Clear the chosen cells whenever the location changes/clears
                setValue("locationCells", [], { shouldDirty: true, shouldValidate: true });
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

      {warehouseLocationId && cellOptions.length > 0 && (
        <Controller
          control={control}
          name="locationCells"
          render={({ fieldState: { error } }) => (
            <View style={{ gap: 8 }}>
              <Label nativeID="locationCells" style={{ marginBottom: 4 }}>
                {isKanban ? "Prateleiras e Caixas" : `${levelLabel}s`}
              </Label>
              <Combobox
                mode="multiple"
                options={cellOptions}
                value={selectedTokens}
                onValueChange={handleCellsChange}
                placeholder={`Selecione as ${levelLabel.toLowerCase()}s`}
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
