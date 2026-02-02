import { useMemo, useCallback, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { getPaints } from "@/api-client";
import { useTheme } from "@/lib/theme";
import type { Paint } from "@/types";
import { IconFlask } from "@tabler/icons-react-native";

// Paint finish labels
const PAINT_FINISH_LABELS: Record<string, string> = {
  SOLID: "Lisa",
  METALLIC: "Metálico",
  PEARL: "Perolizado",
  MATTE: "Fosco",
  SATIN: "Semi Brilho",
};

interface PaintColorPreviewProps {
  paint: Paint;
  size?: number;
}

// Simplified color preview - just the hex color, no complex effects
function SimplePaintColorPreview({ paint, size = 24 }: PaintColorPreviewProps) {
  const { colors } = useTheme();
  const hexColor = paint.hex || "#888888";

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 4,
      backgroundColor: hexColor,
      borderWidth: 1,
      borderColor: colors.border
    }} />
  );
}

interface GeneralPaintingSelectorOptimizedProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  initialPaint?: Paint;
}

interface LogoPaintsSelectorOptimizedProps {
  selectedValues?: string[];
  onValueChange?: (values: string[]) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  initialPaints?: Paint[];
}

// Custom render option for paint items - OPTIMIZED
function useOptimizedPaintRenderOption() {
  const { colors } = useTheme();

  return useCallback(
    (option: any, isSelected: boolean, _onPress?: () => void) => {
      const paint = option as Paint;

      if (!paint) {
        console.warn('[PaintSelector] Received undefined paint in renderOption');
        return null;
      }

      return (
        <View style={styles.optionContainer}>
          {/* Simple Color Preview - no complex effects */}
          <SimplePaintColorPreview paint={paint} size={20} />

          {/* Paint Info - minimal */}
          <View style={styles.paintInfo}>
            {/* Paint Name only */}
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

            {/* Only show finish if available - minimal metadata */}
            {paint.finish && (
              <Text style={[styles.metadataText, { color: colors.mutedForeground }]}>
                {PAINT_FINISH_LABELS[paint.finish] || paint.finish}
              </Text>
            )}
          </View>

          {/* Simple formula indicator */}
          {paint.hasFormula && (
            <IconFlask size={14} color="#16a34a" />
          )}
        </View>
      );
    },
    [colors]
  );
}

/**
 * OPTIMIZED General Painting Selector
 * Key improvements:
 * 1. NO nested includes (paintType, paintBrand, formulas)
 * 2. Reduced page size from 50 to 20
 * 3. Only fetches minimal fields
 * 4. Simplified color preview (no complex effects)
 */
export function GeneralPaintingSelectorOptimized({
  value,
  onValueChange,
  disabled = false,
  error,
  label = "Pintura Geral",
  placeholder = "Selecione a tinta",
  required = false,
  initialPaint,
}: GeneralPaintingSelectorOptimizedProps) {
  const renderOption = useOptimizedPaintRenderOption();
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => {
    if (initialPaint) {
      // Create minimal version
      return [{
        ...initialPaint,
        paintType: null,
        paintBrand: null,
        formulas: [],
        hasFormula: !!initialPaint.formulas?.length || !!initialPaint._count?.formulas
      }];
    }
    return [];
  }, [initialPaint?.id]);

  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // OPTIMIZED Search function - minimal data
  const searchPaints = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    // Track dropdown opening
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      console.log(`🎯 [Paint Dropdown] Opened for the first time`);
    }

    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 20, // REDUCED from 50 to 20
      select: {
        id: true,
        name: true,
        hex: true,
        finish: true,
        // Check if has formula without loading all formula data
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
      console.log(`🔍 [Paint Selector] Fetching page ${page} with minimal data`);
      const startTime = performance.now();

      const response = await getPaints(params);

      const duration = performance.now() - startTime;
      console.log(`✅ [Paint Selector] Loaded ${response?.data?.length || 0} paints in ${duration.toFixed(0)}ms`);

      // Transform data to add hasFormula flag
      const paints = (response.data || []).map(paint => ({
        ...paint,
        hasFormula: (paint._count?.formulas || 0) > 0
      }));

      return {
        data: paints.filter(paint => paint && paint.id && paint.name),
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
      queryKey={["paints", "search", "optimized"]} // Different cache key
      queryFn={searchPaints}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={!required}
      minSearchLength={0}
      pageSize={20} // REDUCED from 50
      debounceMs={200} // REDUCED from 300
      loadOnMount={false} // Only load when opened
    />
  );
}

/**
 * OPTIMIZED Logo Paints Selector (Multiple Selection)
 */
export function LogoPaintsSelectorOptimized({
  selectedValues = [],
  onValueChange,
  disabled = false,
  error,
  label = "Tintas da Logomarca",
  placeholder = "Selecione as tintas da logomarca",
  initialPaints = [],
}: LogoPaintsSelectorOptimizedProps) {
  const renderOption = useOptimizedPaintRenderOption();
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => {
    if (initialPaints?.length) {
      return initialPaints.map(paint => ({
        ...paint,
        paintType: null,
        paintBrand: null,
        formulas: [],
        hasFormula: !!paint.formulas?.length || !!paint._count?.formulas
      }));
    }
    return [];
  }, [initialPaints?.map(p => p.id).join(',')]);

  const getOptionLabel = useCallback((paint: Paint) => paint?.name || "", []);
  const getOptionValue = useCallback((paint: Paint) => paint?.id || "", []);

  // OPTIMIZED Search function
  const searchPaints = async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Paint[];
    hasMore: boolean;
  }> => {
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      console.log(`🎯 [Logo Paints Dropdown] Opened for the first time`);
    }

    const params: any = {
      orderBy: { name: "asc" },
      page: page,
      take: 15, // EVEN SMALLER for multi-select
      select: {
        id: true,
        name: true,
        hex: true,
        finish: true,
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
      console.log(`🔍 [Logo Paints] Fetching page ${page} with minimal data`);
      const startTime = performance.now();

      const response = await getPaints(params);

      const duration = performance.now() - startTime;
      console.log(`✅ [Logo Paints] Loaded ${response?.data?.length || 0} paints in ${duration.toFixed(0)}ms`);

      const paints = (response.data || []).map(paint => ({
        ...paint,
        hasFormula: (paint._count?.formulas || 0) > 0
      }));

      return {
        data: paints.filter(paint => paint && paint.id && paint.name),
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
      queryKey={["paints", "search", "logo", "optimized"]}
      queryFn={searchPaints}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={true}
      minSearchLength={0}
      pageSize={15} // SMALLER for multi-select
      debounceMs={200}
      showCount={true}
      loadOnMount={false} // Only load when opened
    />
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  paintInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  paintName: {
    fontSize: 15,
    fontWeight: "500" as any,
  },
  selectedText: {
    fontWeight: "600" as any,
  },
  metadataText: {
    fontSize: 11,
  },
});