import React, { useMemo } from "react";
import type { GarageGetManyFormData } from "../../../../schemas";
import { FilterTags } from "@/components/ui/filter-tags";

interface GarageFilterTagsProps {
  filters: Partial<GarageGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<GarageGetManyFormData>) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function GarageFilterTags({ filters, searchText, onFilterChange, onSearchChange, onClearAll }: GarageFilterTagsProps) {
  const tags = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    // Search tag
    if (searchText) {
      result.push({
        key: "search",
        label: "Busca",
        value: searchText,
        onRemove: () => onSearchChange(""),
      });
    }

    // Width range tag
    if (filters.widthRange?.min !== undefined || filters.widthRange?.max !== undefined) {
      const min = filters.widthRange?.min;
      const max = filters.widthRange?.max;
      const value = min && max ? `${min}m - ${max}m` : min ? `≥ ${min}m` : `≤ ${max}m`;
      result.push({
        key: "widthRange",
        label: "Largura",
        value,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.widthRange;
          onFilterChange(newFilters);
        },
      });
    }

    // Length range tag
    if (filters.lengthRange?.min !== undefined || filters.lengthRange?.max !== undefined) {
      const min = filters.lengthRange?.min;
      const max = filters.lengthRange?.max;
      const value = min && max ? `${min}m - ${max}m` : min ? `≥ ${min}m` : `≤ ${max}m`;
      result.push({
        key: "lengthRange",
        label: "Comprimento",
        value,
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.lengthRange;
          onFilterChange(newFilters);
        },
      });
    }

    // Location tag
    if (filters.where?.location) {
      const locationValue = typeof filters.where.location === 'string'
        ? filters.where.location
        : (filters.where.location as any)?.contains || '';
      result.push({
        key: "location",
        label: "Local",
        value: locationValue,
        onRemove: () => {
          const newFilters = { ...filters };
          if (newFilters.where) {
            const { location, ...rest } = newFilters.where;
            newFilters.where = Object.keys(rest).length > 0 ? rest : undefined;
          }
          onFilterChange(newFilters);
        },
      });
    }

    // Has lanes tag
    if (filters.hasLanes) {
      result.push({
        key: "hasLanes",
        label: "Possui Faixas",
        value: "Sim",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.hasLanes;
          onFilterChange(newFilters);
        },
      });
    }

    // Has trucks tag
    if (filters.hasTrucks) {
      result.push({
        key: "hasTrucks",
        label: "Possui Caminhões",
        value: "Sim",
        onRemove: () => {
          const newFilters = { ...filters };
          delete newFilters.hasTrucks;
          onFilterChange(newFilters);
        },
      });
    }

    return result;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  if (tags.length === 0) {
    return null;
  }

  return <FilterTags tags={tags} onClearAll={onClearAll} />;
}
