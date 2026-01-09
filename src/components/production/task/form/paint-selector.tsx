import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { getPaints } from "@/api-client";
import { useTheme } from "@/lib/theme";
import type { Paint } from "@/types";
import { PaintPreview } from "@/components/painting/preview/painting-preview";
import { PaintFinishPreview } from "@/components/painting/effects/paint-finish-preview";
import { PAINT_FINISH } from "@/constants";
import { IconFlask } from "@tabler/icons-react-native";

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
  const renderOption = usePaintRenderOption();

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => initialPaint ? [initialPaint] : [], [initialPaint?.id]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // Search function for Combobox
  const searchPaints = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 50,
      include: {
        paintType: true,
        paintBrand: true,
        formulas: true,
        _count: {
          select: {
            formulas: true,
          },
        },
      },
    };

    // Only add search filter if there's a search term
    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getPaints(params);

      return {
        data: (response.data || []).filter(paint => paint && paint.id && paint.name),
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[GeneralPaintingSelector] Error fetching paints:', error);
      return { data: [], hasMore: false };
    }
  };

  return (
    <Combobox<Paint>
      value={value || ""}
      onValueChange={(newValue) => {
        onValueChange?.(newValue as string | undefined);
      }}
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
      pageSize={50}
      debounceMs={300}
    />
  );
}

// Logo Paints Selector (Multiple Selection)
export function LogoPaintsSelector({
  selectedValues = [],
  onValueChange,
  disabled = false,
  error,
  label = "Tintas da Logo",
  placeholder = "Selecione as tintas da logo",
  initialPaints = [],
}: LogoPaintsSelectorProps) {
  const renderOption = usePaintRenderOption();

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => initialPaints || [], [initialPaints?.map(p => p.id).join(',')]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // Search function for Combobox
  const searchPaints = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 50,
      include: {
        paintType: true,
        paintBrand: true,
        formulas: true,
        _count: {
          select: {
            formulas: true,
          },
        },
      },
    };

    // Only add search filter if there's a search term
    if (search && search.trim()) {
      params.searchingFor = search.trim();
    }

    try {
      const response = await getPaints(params);

      return {
        data: (response.data || []).filter(paint => paint && paint.id && paint.name),
        hasMore: response.meta?.hasNextPage || false,
      };
    } catch (error) {
      console.error('[LogoPaintsSelector] Error fetching paints:', error);
      return { data: [], hasMore: false };
    }
  };

  return (
    <Combobox<Paint>
      mode="multiple"
      value={selectedValues}
      onValueChange={(newValues) => {
        onValueChange?.(newValues as string[]);
      }}
      placeholder={placeholder}
      label={label}
      searchPlaceholder="Buscar tintas..."
      emptyText="Nenhuma tinta encontrada"
      disabled={disabled}
      error={error}
      async={true}
      queryKey={["paints", "search", "logo"]}
      queryFn={searchPaints}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={true}
      minSearchLength={0}
      pageSize={50}
      debounceMs={300}
      showCount={true}
    />
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
