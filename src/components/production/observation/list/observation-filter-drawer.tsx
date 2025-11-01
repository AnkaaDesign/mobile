import { useState, useEffect, useMemo } from "react";
import { View } from "react-native";
import type { ObservationGetManyFormData } from "@/schemas";
import { BaseFilterDrawer } from "@/components/common/filters";
import { BooleanFilter, DateRangeFilter } from "@/components/common/filters";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/lib/theme";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import type { Task } from "@/types";

interface ObservationFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilters: Partial<ObservationGetManyFormData>;
  onApply: (filters: Partial<ObservationGetManyFormData>) => void;
  onClear: () => void;
  tasks: Task[];
}

interface FilterState {
  taskIds?: string[];
  hasFiles?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export function ObservationFilterDrawer({
  open,
  onOpenChange,
  currentFilters,
  onApply,
  onClear,
  tasks,
}: ObservationFilterDrawerProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>({});

  // Initialize from current filters when drawer opens
  useEffect(() => {
    if (open) {
      setFilters({
        taskIds: currentFilters.taskIds || [],
        hasFiles: currentFilters.hasFiles,
        createdAfter: currentFilters.createdAt?.gte,
        createdBefore: currentFilters.createdAt?.lte,
      });
    }
  }, [open, currentFilters]);

  const handleApply = () => {
    const newFilters: Partial<ObservationGetManyFormData> = {};

    if (filters.taskIds && filters.taskIds.length > 0) {
      newFilters.taskIds = filters.taskIds;
    }

    if (filters.hasFiles !== undefined) {
      newFilters.hasFiles = filters.hasFiles;
    }

    if (filters.createdAfter || filters.createdBefore) {
      newFilters.createdAt = {};
      if (filters.createdAfter) {
        newFilters.createdAt.gte = filters.createdAfter;
      }
      if (filters.createdBefore) {
        newFilters.createdAt.lte = filters.createdBefore;
      }
    }

    onApply(newFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const activeFiltersCount = [
    filters.taskIds && filters.taskIds.length > 0,
    filters.hasFiles !== undefined,
    filters.createdAfter || filters.createdBefore,
  ].filter(Boolean).length;

  const taskOptions = useMemo(
    () =>
      tasks.map((task) => ({
        value: task.id,
        label: task.name,
      })),
    [tasks]
  );

  const filterSections = [
    {
      id: "tasks",
      title: "Tarefas",
      defaultOpen: true,
      badge: filters.taskIds?.length || 0,
      content: (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            Selecionar Tarefas
          </Text>
          <MultiCombobox
            options={taskOptions}
            selectedValues={filters.taskIds || []}
            onValueChange={(values) => setFilters((prev) => ({ ...prev, taskIds: values }))}
            placeholder="Todas as tarefas"
            searchPlaceholder="Buscar tarefas..."
            emptyText="Nenhuma tarefa encontrada"
          />
        </View>
      ),
    },
    {
      id: "files",
      title: "Arquivos",
      defaultOpen: false,
      badge: filters.hasFiles !== undefined ? 1 : 0,
      content: (
        <View style={{ gap: 12 }}>
          <BooleanFilter
            label="Possui Arquivos"
            description="Mostrar apenas observações com arquivos anexados"
            value={filters.hasFiles === true}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, hasFiles: value ? true : undefined }))
            }
          />
          <BooleanFilter
            label="Sem Arquivos"
            description="Mostrar apenas observações sem arquivos"
            value={filters.hasFiles === false}
            onChange={(value) =>
              setFilters((prev) => ({ ...prev, hasFiles: value ? false : undefined }))
            }
          />
        </View>
      ),
    },
    {
      id: "dates",
      title: "Data de Criação",
      defaultOpen: false,
      badge: (filters.createdAfter || filters.createdBefore) ? 1 : 0,
      content: (
        <DateRangeFilter
          label="Período de Criação"
          value={{
            from: filters.createdAfter,
            to: filters.createdBefore
          }}
          onChange={(range) =>
            setFilters((prev) => ({
              ...prev,
              createdAfter: range?.from,
              createdBefore: range?.to
            }))
          }
        />
      ),
    },
  ];

  return (
    <BaseFilterDrawer
      open={open}
      onOpenChange={onOpenChange}
      sections={filterSections}
      onApply={handleApply}
      onClear={handleClear}
      activeFiltersCount={activeFiltersCount}
      title="Filtros de Observações"
      description="Configure os filtros para refinar sua busca"
    />
  );
}
