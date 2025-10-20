import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { BaseFilterDrawer, FilterSection, BooleanFilter } from "@/components/common/filters";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import type { PaintTypeGetManyFormData } from "../../../../schemas";

interface PaintTypeFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    needGround?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onApply: () => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function PaintTypeFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  activeFiltersCount,
}: PaintTypeFilterDrawerProps) {
  const { colors } = useTheme();

  const filterSections = useMemo(
    () => [
      {
        id: "general",
        title: "Geral",
        defaultOpen: true,
        badge: filters.needGround ? 1 : 0,
        content: (
          <BooleanFilter
            label="Necessita Primer"
            description="Mostrar apenas tipos que necessitam primer/fundo"
            value={!!filters.needGround}
            onChange={(value) =>
              onFiltersChange({
                ...filters,
                needGround: value || undefined,
              })
            }
          />
        ),
      },
    ],
    [filters, onFiltersChange, colors]
  );

  return (
    <BaseFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      sections={filterSections}
      onApply={onApply}
      onClear={onClear}
      activeFiltersCount={activeFiltersCount}
      title="Filtros de Tipos de Tinta"
      description="Configure os filtros para refinar sua busca"
    />
  );
}
