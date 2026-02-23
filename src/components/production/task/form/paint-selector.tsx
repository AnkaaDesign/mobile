import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { getPaints } from "@/api-client";
import { useTheme } from "@/lib/theme";
import type { Paint } from "@/types";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { PaintFinishPreview } from "@/components/painting/effects/paint-finish-preview";
import { PAINT_FINISH } from "@/constants";
import { IconFlask, IconX } from "@tabler/icons-react-native";

// Paint finish labels
const PAINT_FINISH_LABELS: Record<string, string> = {
  SOLID: "Lisa",
  METALLIC: "Metálico",
  PEARL: "Perolizado",
  MATTE: "Fosco",
  SATIN: "Semi Brilho",
};

// Truck manufacturer labels
const TRUCK_MANUFACTURER_LABELS: Record<string, string> = {
  SCANIA: "Scania",
  VOLVO: "Volvo",
  DAF: "DAF",
  VOLKSWAGEN: "Volkswagen",
  IVECO: "Iveco",
  MERCEDES_BENZ: "Mercedes Benz",
};

interface PaintColorPreviewProps {
  paint: Paint;
  size?: number;
}

function PaintColorPreview({ paint, size = 24 }: PaintColorPreviewProps) {
  const { colors } = useTheme();
  const hexColor = paint.hex || "#888888";

  // Square preview with rounded corners (like web version)
  // Priority: colorPreview image > finish effect > solid hex color
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 4,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border
    }}>
      {paint.colorPreview ? (
        // Use stored color preview image if available
        <PaintPreview
          paint={paint}
          baseColor={hexColor}
          width={size}
          height={size}
          borderRadius={0}
        />
      ) : paint.finish ? (
        // Render finish effect if paint has a finish type
        <PaintFinishPreview
          baseColor={hexColor}
          finish={paint.finish as PAINT_FINISH}
          width={size}
          height={size}
          disableAnimations={true}
        />
      ) : (
        // Fallback to solid hex color
        <View style={{ width: size, height: size, backgroundColor: hexColor }} />
      )}
    </View>
  );
}

interface BasePaintSelectorProps {
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  initialPaint?: Paint;
}

interface GeneralPaintingSelectorProps extends BasePaintSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
}

interface LogoPaintsSelectorProps extends BasePaintSelectorProps {
  selectedValues?: string[];
  onValueChange?: (values: string[]) => void;
  initialPaints?: Paint[];
}

// Custom render option for paint items
function usePaintRenderOption() {
  const { colors } = useTheme();

  return useCallback(
    (option: any, isSelected: boolean, _onPress?: () => void) => {
      // The option IS the Paint object directly (not wrapped)
      const paint = option as Paint;

      // Guard against undefined paint
      if (!paint) {
        console.warn('[PaintSelector] Received undefined paint in renderOption');
        return null;
      }

      return (
        <View style={styles.optionContainer}>
          {/* Color Preview */}
          <PaintColorPreview paint={paint} size={24} />

          {/* Paint Info */}
          <View style={styles.paintInfo}>
            {/* Paint Name (Primary) */}
            <Text
              style={[
                styles.paintName,
                { color: colors.foreground },
                isSelected && styles.selectedText,
              ]}
              numberOfLines={1}
            >
              {paint?.name || ""}
            </Text>

            {/* Metadata (Secondary) */}
            <View style={styles.metadataContainer}>
              {paint.paintType?.name && (
                <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
                  {paint.paintType.name}
                </Text>
              )}

              {paint.finish && (
                <>
                  {paint.paintType?.name && (
                    <Text style={[styles.separator, { color: colors.mutedForeground }]}>
                      {" • "}
                    </Text>
                  )}
                  <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
                    {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
                  </Text>
                </>
              )}

              {paint.manufacturer && (
                <>
                  <Text style={[styles.separator, { color: colors.mutedForeground }]}>
                    {" • "}
                  </Text>
                  <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
                    {TRUCK_MANUFACTURER_LABELS[paint.manufacturer] || paint.manufacturer}
                  </Text>
                </>
              )}

              {paint.paintBrand?.name && (
                <>
                  <Text style={[styles.separator, { color: colors.mutedForeground }]}>
                    {" • "}
                  </Text>
                  <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
                    {paint.paintBrand.name}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Formula indicator */}
          <IconFlask
            size={16}
            color={((paint._count?.formulas ?? 0) > 0 || (paint.formulas?.length ?? 0) > 0) ? "#16a34a" : colors.destructive}
          />
        </View>
      );
    },
    [colors]
  );
}

// General Painting Selector (Single Selection)
export function GeneralPaintingSelector({
  value,
  onValueChange,
  disabled = false,
  error,
  label = "Pintura Geral",
  placeholder = "Selecione a tinta",
  required = false,
  initialPaint,
}: GeneralPaintingSelectorProps) {
  const { colors } = useTheme();
  const renderOption = usePaintRenderOption();

  // Track selected paint object for chip display (matching web pattern)
  const [selectedPaint, setSelectedPaint] = useState<Paint | null>(initialPaint || null);

  // Sync from initialPaint when it changes (edit mode)
  useEffect(() => {
    if (initialPaint) {
      setSelectedPaint(initialPaint);
    }
  }, [initialPaint?.id]);

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => initialPaint ? [initialPaint] : [], [initialPaint?.id]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // Search function for Combobox
  const searchPaints = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        hex: true,
        hexColor: true,
        finish: true,
        colorPreview: true,
        manufacturer: true,
        paintType: {
          select: {
            id: true,
            name: true,
          },
        },
        paintBrand: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            formulas: true,
          },
        },
      },
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getPaints(params);
      const paints = (response.data || []).filter(paint => paint && paint.id && paint.name);

      // Cache paint objects for chip display
      paintsCache.current = new Map(paints.map(p => [p.id, p]));

      return {
        data: paints,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (err) {
      console.error('[GeneralPaintingSelector] Error fetching paints:', err);
      return { data: [], hasMore: false };
    }
  }, []);

  // Cache fetched paints to resolve selected paint object
  const paintsCache = useRef<Map<string, Paint>>(new Map());

  // Handle value change and track selected paint
  const handleValueChange = useCallback((newValue: string | string[] | null | undefined) => {
    const stringValue = Array.isArray(newValue) ? newValue[0] : newValue;
    onValueChange?.(stringValue || undefined);

    if (stringValue) {
      // Try to find paint from cache or initialPaint
      const cached = paintsCache.current.get(stringValue);
      if (cached) {
        setSelectedPaint(cached);
      } else if (initialPaint?.id === stringValue) {
        setSelectedPaint(initialPaint);
      }
    } else {
      setSelectedPaint(null);
    }
  }, [onValueChange, initialPaint]);

  // Clear selected paint when value is externally cleared
  useEffect(() => {
    if (!value) {
      setSelectedPaint(null);
    }
  }, [value]);

  return (
    <View>
      <Combobox<Paint>
        value={value || ""}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        label={required ? `${label} *` : label}
        searchPlaceholder="Buscar tinta..."
        emptyText="Nenhuma tinta encontrada"
        disabled={disabled}
        error={error}
        async={true}
        queryKey={["paints", "search"]}
        queryFn={searchPaints}
        initialOptions={initialOptions}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        renderOption={renderOption}
        clearable={!required}
        minSearchLength={0}
        pageSize={20}
        debounceMs={300}
        loadOnMount={false}
      />

      {/* Selected paint chip (matching web badge display) */}
      {selectedPaint && value && (
        <View style={chipStyles.chipsContainer}>
          <Pressable
            style={[chipStyles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={disabled ? undefined : () => handleValueChange(null)}
            disabled={disabled}
          >
            <PaintColorPreview paint={selectedPaint} size={16} />
            <Text style={[chipStyles.chipName, { color: colors.foreground }]} numberOfLines={1}>
              {selectedPaint.name}
            </Text>
            {selectedPaint.paintType?.name && (
              <Text style={[chipStyles.chipType, { color: colors.mutedForeground }]}>
                ({selectedPaint.paintType.name})
              </Text>
            )}
            {!disabled && (
              <IconX size={12} color={colors.mutedForeground} />
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Logo Paints Selector (Multiple Selection)
export function LogoPaintsSelector({
  selectedValues = [],
  onValueChange,
  disabled = false,
  error,
  label = "Tintas da Logomarca",
  placeholder = "Selecione as tintas da logomarca",
  initialPaints = [],
}: LogoPaintsSelectorProps) {
  const { colors } = useTheme();
  const renderOption = usePaintRenderOption();

  // Track selected paint objects for chip display
  const [selectedPaintsMap, setSelectedPaintsMap] = useState<Map<string, Paint>>(new Map());

  // Initialize from initialPaints
  useEffect(() => {
    if (initialPaints.length > 0) {
      setSelectedPaintsMap(prev => {
        const next = new Map(prev);
        for (const paint of initialPaints) {
          if (paint?.id) next.set(paint.id, paint);
        }
        return next;
      });
    }
  }, [initialPaints?.map(p => p.id).join(',')]);

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => initialPaints || [], [initialPaints?.map(p => p.id).join(',')]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // Search function for Combobox
  const searchPaints = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        hex: true,
        hexColor: true,
        finish: true,
        colorPreview: true,
        manufacturer: true,
        paintType: {
          select: {
            id: true,
            name: true,
          },
        },
        paintBrand: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            formulas: true,
          },
        },
      },
    };

    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getPaints(params);
      const paints = (response.data || []).filter((paint: Paint) => paint && paint.id && paint.name);

      // Cache paint objects for chip display
      setSelectedPaintsMap(prev => {
        const next = new Map(prev);
        for (const paint of paints) {
          if (paint?.id) next.set(paint.id, paint);
        }
        return next;
      });

      return {
        data: paints,
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (err) {
      console.error('[LogoPaintsSelector] Error fetching paints:', err);
      return { data: [], hasMore: false };
    }
  }, []);

  // Handle value change and track selected paints
  const handleValueChange = useCallback((newValues: string | string[] | null | undefined) => {
    onValueChange?.(newValues as string[]);
  }, [onValueChange]);

  // Remove a paint from selection
  const handleRemovePaint = useCallback((paintId: string) => {
    const newValues = selectedValues.filter(id => id !== paintId);
    onValueChange?.(newValues);
  }, [selectedValues, onValueChange]);

  // Get selected paint objects for chip display
  const selectedPaintsList = useMemo(() => {
    return selectedValues
      .map(id => selectedPaintsMap.get(id))
      .filter((p): p is Paint => !!p);
  }, [selectedValues, selectedPaintsMap]);

  return (
    <View>
      <Combobox<Paint>
        mode="multiple"
        value={selectedValues}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        label={label}
        searchPlaceholder="Buscar tintas..."
        emptyText="Nenhuma tinta encontrada"
        disabled={disabled}
        error={error}
        async={true}
        queryKey={["paints", "search"]}
        queryFn={searchPaints}
        initialOptions={initialOptions}
        getOptionLabel={getOptionLabel}
        getOptionValue={getOptionValue}
        renderOption={renderOption}
        clearable={true}
        minSearchLength={0}
        pageSize={20}
        debounceMs={300}
        showCount={true}
        loadOnMount={false}
        hideDefaultBadges={true}
      />

      {/* Selected paint chips row (matching web badge display) */}
      {selectedPaintsList.length > 0 && (
        <View style={chipStyles.chipsContainer}>
          {selectedPaintsList.map((paint) => (
            <Pressable
              key={paint.id}
              style={[chipStyles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={disabled ? undefined : () => handleRemovePaint(paint.id)}
              disabled={disabled}
            >
              <PaintColorPreview paint={paint} size={16} />
              <Text style={[chipStyles.chipName, { color: colors.foreground }]} numberOfLines={1}>
                {paint.name}
              </Text>
              {paint.paintType?.name && (
                <Text style={[chipStyles.chipType, { color: colors.mutedForeground }]}>
                  ({paint.paintType.name})
                </Text>
              )}
              {!disabled && (
                <IconX size={12} color={colors.mutedForeground} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // spacing.md
    flex: 1,
  },
  colorPreview: {
    borderRadius: 4,
    borderWidth: 1,
    flexShrink: 0,
  },
  paintInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  paintName: {
    fontSize: 16, // fontSize.base
    fontWeight: "500" as any, // fontWeight.medium
  },
  selectedText: {
    fontWeight: "600" as any, // fontWeight.semibold
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metadataText: {
    fontSize: 12, // fontSize.xs
  },
  separator: {
    fontSize: 12, // fontSize.xs
  },
});

const chipStyles = StyleSheet.create({
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  chipName: {
    fontSize: 12,
    fontWeight: "500" as any,
    maxWidth: 120,
  },
  chipType: {
    fontSize: 11,
    opacity: 0.7,
  },
});
