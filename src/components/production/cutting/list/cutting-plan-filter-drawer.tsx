import React, { useState, useCallback, useMemo } from "react";
import { View, Text } from "react-native";
import type { CutGetManyFormData } from "../../../../schemas";
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from "../../../../constants";
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from "../../../../constants";
import { BaseFilterDrawer, FilterSection, SelectFilter, DateRangeFilter } from "@/components/common/filters";
import { useTheme } from "@/lib/theme";

interface CuttingPlanFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Partial<CutGetManyFormData>;
  onFilterChange: (filters: Partial<CutGetManyFormData>) => void;
  onApply: () => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function CuttingPlanFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onApply,
  onClear,
  activeFiltersCount,
}: CuttingPlanFilterDrawerProps) {
  const { colors } = useTheme();

  // Extract filter values from the filters object
  const status = filters.where?.status as CUT_STATUS | undefined;
  const type = filters.where?.type as CUT_TYPE | undefined;
  const origin = filters.where?.origin as CUT_ORIGIN | undefined;
  const startedAfter = filters.where?.startedAt?.gte;
  const startedBefore = filters.where?.startedAt?.lte;
  const completedAfter = filters.where?.completedAt?.gte;
  const completedBefore = filters.where?.completedAt?.lte;

  // Status options
  const statusOptions = useMemo(
    () =>
      Object.values(CUT_STATUS).map((value) => ({
        value,
        label: CUT_STATUS_LABELS[value],
      })),
    [],
  );

  // Type options
  const typeOptions = useMemo(
    () =>
      Object.values(CUT_TYPE).map((value) => ({
        value,
        label: CUT_TYPE_LABELS[value],
      })),
    [],
  );

  // Origin options
  const originOptions = useMemo(
    () =>
      Object.values(CUT_ORIGIN).map((value) => ({
        value,
        label: CUT_ORIGIN_LABELS[value],
      })),
    [],
  );

  const handleStatusChange = useCallback(
    (value: string | undefined) => {
      const newFilters = { ...filters };
      if (!newFilters.where) newFilters.where = {};
      if (value) {
        newFilters.where.status = value as CUT_STATUS;
      } else {
        delete newFilters.where.status;
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleTypeChange = useCallback(
    (value: string | undefined) => {
      const newFilters = { ...filters };
      if (!newFilters.where) newFilters.where = {};
      if (value) {
        newFilters.where.type = value as CUT_TYPE;
      } else {
        delete newFilters.where.type;
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleOriginChange = useCallback(
    (value: string | undefined) => {
      const newFilters = { ...filters };
      if (!newFilters.where) newFilters.where = {};
      if (value) {
        newFilters.where.origin = value as CUT_ORIGIN;
      } else {
        delete newFilters.where.origin;
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleStartedDateChange = useCallback(
    (start: Date | undefined, end: Date | undefined) => {
      const newFilters = { ...filters };
      if (!newFilters.where) newFilters.where = {};
      if (start || end) {
        newFilters.where.startedAt = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      } else {
        delete newFilters.where.startedAt;
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const handleCompletedDateChange = useCallback(
    (start: Date | undefined, end: Date | undefined) => {
      const newFilters = { ...filters };
      if (!newFilters.where) newFilters.where = {};
      if (start || end) {
        newFilters.where.completedAt = {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        };
      } else {
        delete newFilters.where.completedAt;
      }
      onFilterChange(newFilters);
    },
    [filters, onFilterChange],
  );

  const filterSections = useMemo(
    () => [
      {
        id: "status",
        title: "Status e Tipo",
        defaultOpen: true,
        badge: (status ? 1 : 0) + (type ? 1 : 0) + (origin ? 1 : 0),
        content: (
          <>
            <SelectFilter
              label="Status"
              value={status}
              onChange={handleStatusChange}
              options={statusOptions}
              placeholder="Todos os status"
            />
            <SelectFilter
              label="Tipo"
              value={type}
              onChange={handleTypeChange}
              options={typeOptions}
              placeholder="Todos os tipos"
            />
            <SelectFilter
              label="Origem"
              value={origin}
              onChange={handleOriginChange}
              options={originOptions}
              placeholder="Todas as origens"
            />
          </>
        ),
      },
      {
        id: "dates",
        title: "Datas",
        defaultOpen: false,
        badge: (startedAfter || startedBefore ? 1 : 0) + (completedAfter || completedBefore ? 1 : 0),
        content: (
          <>
            <DateRangeFilter
              label="Data de Início"
              startDate={startedAfter}
              endDate={startedBefore}
              onChange={handleStartedDateChange}
            />
            <DateRangeFilter
              label="Data de Conclusão"
              startDate={completedAfter}
              endDate={completedBefore}
              onChange={handleCompletedDateChange}
            />
          </>
        ),
      },
    ],
    [
      status,
      type,
      origin,
      startedAfter,
      startedBefore,
      completedAfter,
      completedBefore,
      statusOptions,
      typeOptions,
      originOptions,
      handleStatusChange,
      handleTypeChange,
      handleOriginChange,
      handleStartedDateChange,
      handleCompletedDateChange,
    ],
  );

  return (
    <BaseFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      sections={filterSections}
      onApply={onApply}
      onClear={onClear}
      activeFiltersCount={activeFiltersCount}
      title="Filtros de Cortes"
      description="Configure os filtros para refinar sua busca"
    />
  );
}
