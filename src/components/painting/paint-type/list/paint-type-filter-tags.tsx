import React, { useMemo } from "react";
import { FilterTags, FilterTag } from "@/components/ui/filter-tags";
import type { PaintTypeGetManyFormData } from "../../../../schemas";

interface PaintTypeFilterTagsProps {
  filters: {
    needGround?: boolean;
  };
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function PaintTypeFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: PaintTypeFilterTagsProps) {
  const tags = useMemo(() => {
    const result: FilterTag[] = [];

    // Search tag
    if (searchText) {
      result.push({
        id: "search",
        label: "Busca",
        value: searchText,
        onRemove: () => onSearchChange(""),
      });
    }

    // Need ground filter
    if (filters.needGround) {
      result.push({
        id: "needGround",
        label: "Necessita Primer",
        value: "Sim",
        onRemove: () => onFilterChange({ ...filters, needGround: undefined }),
      });
    }

    return result;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  if (tags.length === 0) {
    return null;
  }

  return <FilterTags tags={tags} onClearAll={onClearAll} />;
}
