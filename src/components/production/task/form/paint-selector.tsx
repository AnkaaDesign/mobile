import { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { usePaints, usePaint } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, spacing } from "@/constants/design-system";
import type { Paint } from "@/types";

// Palette colors mapping
const PALETTE_COLORS: Record<string, string> = {
  BLACK: "#000000",
  GRAY: "#6B7280",
  WHITE: "#FFFFFF",
  SILVER: "#C0C0C0",
  GOLDEN: "#FFD700",
  YELLOW: "#FFEB3B",
  ORANGE: "#FF9800",
  BROWN: "#8B4513",
  RED: "#EF4444",
  PINK: "#EC4899",
  PURPLE: "#9333EA",
  BLUE: "#3B82F6",
  GREEN: "#22C55E",
  BEIGE: "#F5F5DC",
};

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
  const color = paint.hex || PALETTE_COLORS[paint.palette || ""] || "#888888";

  // For simplicity in React Native, we'll just show solid colors
  // Advanced finish effects would require react-native-svg or similar
  return (
    <View
      style={[
        styles.colorPreview,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderColor: colors.border,
        },
      ]}
    />
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
      const paint = option.paint as Paint;

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
              {paint.name}
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
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const renderOption = usePaintRenderOption();

  // Fetch the selected paint if value is provided but not in initialPaint
  const shouldFetchSelectedPaint = value && (!initialPaint || initialPaint.id !== value);
  const { data: selectedPaint } = usePaint(
    value || "",
    { include: { paintType: true, paintBrand: true }, enabled: !!shouldFetchSelectedPaint }
  );

  // Fetch paints with pagination
  const { data: paintsResponse, isLoading } = usePaints({
    searchingFor: searchText,
    orderBy: { name: "asc" },
    page,
    take: pageSize,
    include: { paintType: true, paintBrand: true },
  });

  const paints = paintsResponse?.data || [];
  const hasMore = paintsResponse?.meta?.hasNextPage || false;

  // Combine initial paint with fetched paints
  const allPaints = useMemo(() => {
    const paintList = [...paints];

    // Add selected paint if fetched and not in list
    if (selectedPaint?.data && !paintList.some((p) => p.id === selectedPaint.data!.id)) {
      paintList.unshift(selectedPaint.data);
    }

    if (initialPaint && !paintList.some((p) => p.id === initialPaint.id)) {
      paintList.unshift(initialPaint);
    }

    return paintList;
  }, [paints, initialPaint, selectedPaint]);

  // Map to combobox options
  const options = useMemo(() => {
    return allPaints.map((paint) => ({
      value: paint.id,
      label: paint.name,
      paint, // Store full paint object for rendering
    }));
  }, [allPaints]);

  // Handle load more
  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log("[GeneralPaintingSelector] Loading more paints, current page:", page);
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore, page]);

  // Handle search change
  const handleSearchChange = useCallback((text: string) => {
    console.log("[GeneralPaintingSelector] Search changed:", text);
    setSearchText(text);
    setPage(1);
  }, []);

  return (
    <Combobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      searchPlaceholder="Buscar tinta..."
      emptyText="Nenhuma tinta encontrada"
      disabled={disabled}
      error={error}
      loading={isLoading && page === 1}
      onSearchChange={handleSearchChange}
      onEndReached={handleEndReached}
      renderOption={renderOption}
      clearable={!required}
    />
  );
}

// Logo Paints Selector (Multiple Selection)
export function LogoPaintsSelector({
  selectedValues = [],
  onValueChange,
  disabled = false,
  error,
  label = "Tintas do Logo",
  placeholder = "Selecione as tintas do logo",
  initialPaints = [],
}: LogoPaintsSelectorProps) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const renderOption = usePaintRenderOption();

  // Fetch paints with pagination
  const { data: paintsResponse, isLoading } = usePaints({
    searchingFor: searchText,
    orderBy: { name: "asc" },
    page,
    take: pageSize,
    include: { paintType: true, paintBrand: true },
  });

  const paints = paintsResponse?.data || [];
  const hasMore = paintsResponse?.meta?.hasNextPage || false;

  // Combine initial paints with fetched paints and selected paints
  const allPaints = useMemo(() => {
    const paintList = [...paints];

    // Add initial paints not in fetched list
    initialPaints.forEach((paint) => {
      if (!paintList.some((p) => p.id === paint.id)) {
        paintList.unshift(paint);
      }
    });

    return paintList;
  }, [paints, initialPaints]);

  // Map to combobox options
  const options = useMemo(() => {
    return allPaints.map((paint) => ({
      value: paint.id,
      label: paint.name,
      paint, // Store full paint object for rendering
    }));
  }, [allPaints]);

  // Handle load more
  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      console.log("[LogoPaintsSelector] Loading more paints, current page:", page);
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore, page]);

  // Handle search change
  const handleSearchChange = useCallback((text: string) => {
    console.log("[LogoPaintsSelector] Search changed:", text);
    setSearchText(text);
    setPage(1);
  }, []);

  return (
    <MultiCombobox
      selectedValues={selectedValues}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      label={label}
      selectedText="tintas selecionadas"
      searchPlaceholder="Buscar tintas..."
      emptyText="Nenhuma tinta encontrada"
      disabled={disabled}
      error={error}
      loading={isLoading && page === 1}
      onSearchChange={handleSearchChange}
      onEndReached={handleEndReached}
      renderOption={renderOption}
      showBadges={true}
      badgeStyle="chip"
    />
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
  selectedText: {
    fontWeight: fontWeight.semibold as any,
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metadataText: {
    fontSize: fontSize.xs,
  },
  separator: {
    fontSize: fontSize.xs,
  },
});
