import React, { useMemo } from "react";
import { View } from "react-native";
import type { CutGetManyFormData } from "../../../../schemas";
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from "../../../../constants";
import { FilterTag } from "@/components/ui/filter-tag";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CuttingPlanFilterTagsProps {
  filters: Partial<CutGetManyFormData>;
  searchText?: string;
  onFilterChange: (filters: Partial<CutGetManyFormData>) => void;
  onSearchChange: (search: string) => void;
  onClearAll: () => void;
}

export function CuttingPlanFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: CuttingPlanFilterTagsProps) {
  const tags = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = [];

    // Search tag
    if (searchText) {
      result.push({
        key: "searchingFor",
        label: "Busca",
        value: searchText,
      });
    }

    // Status filter
    if (filters.where?.status) {
      result.push({
        key: "status",
        label: "Status",
        value: CUT_STATUS_LABELS[filters.where.status],
      });
    }

    // Type filter
    if (filters.where?.type) {
      result.push({
        key: "type",
        label: "Tipo",
        value: CUT_TYPE_LABELS[filters.where.type],
      });
    }

    // Origin filter
    if (filters.where?.origin) {
      result.push({
        key: "origin",
        label: "Origem",
        value: CUT_ORIGIN_LABELS[filters.where.origin],
      });
    }

    // Started date filter
    if (filters.where?.startedAt) {
      const { gte, lte } = filters.where.startedAt;
      if (gte && lte) {
        result.push({
          key: "startedAt",
          label: "Início",
          value: `${format(gte, "dd/MM/yyyy", { locale: ptBR })} - ${format(lte, "dd/MM/yyyy", { locale: ptBR })}`,
        });
      } else if (gte) {
        result.push({
          key: "startedAt",
          label: "Início após",
          value: format(gte, "dd/MM/yyyy", { locale: ptBR }),
        });
      } else if (lte) {
        result.push({
          key: "startedAt",
          label: "Início antes",
          value: format(lte, "dd/MM/yyyy", { locale: ptBR }),
        });
      }
    }

    // Completed date filter
    if (filters.where?.completedAt) {
      const { gte, lte } = filters.where.completedAt;
      if (gte && lte) {
        result.push({
          key: "completedAt",
          label: "Conclusão",
          value: `${format(gte, "dd/MM/yyyy", { locale: ptBR })} - ${format(lte, "dd/MM/yyyy", { locale: ptBR })}`,
        });
      } else if (gte) {
        result.push({
          key: "completedAt",
          label: "Conclusão após",
          value: format(gte, "dd/MM/yyyy", { locale: ptBR }),
        });
      } else if (lte) {
        result.push({
          key: "completedAt",
          label: "Conclusão antes",
          value: format(lte, "dd/MM/yyyy", { locale: ptBR }),
        });
      }
    }

    return result;
  }, [filters, searchText]);

  const handleRemove = (key: string) => {
    if (key === "searchingFor") {
      onSearchChange("");
    } else if (key === "status") {
      const newFilters = { ...filters };
      if (newFilters.where) {
        delete newFilters.where.status;
      }
      onFilterChange(newFilters);
    } else if (key === "type") {
      const newFilters = { ...filters };
      if (newFilters.where) {
        delete newFilters.where.type;
      }
      onFilterChange(newFilters);
    } else if (key === "origin") {
      const newFilters = { ...filters };
      if (newFilters.where) {
        delete newFilters.where.origin;
      }
      onFilterChange(newFilters);
    } else if (key === "startedAt") {
      const newFilters = { ...filters };
      if (newFilters.where) {
        delete newFilters.where.startedAt;
      }
      onFilterChange(newFilters);
    } else if (key === "completedAt") {
      const newFilters = { ...filters };
      if (newFilters.where) {
        delete newFilters.where.completedAt;
      }
      onFilterChange(newFilters);
    }
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 8, paddingBottom: 8 }}>
      <FilterTag tags={tags} onRemove={handleRemove} onClearAll={onClearAll} />
    </View>
  );
}
