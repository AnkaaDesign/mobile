import { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconX } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { TASK_STATUS_LABELS } from "@/constants";
import { useSectors, useCustomers, useUsers } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaskFilterTagsProps {
  filters: any;
  searchText?: string;
  onFilterChange: (filters: any) => void;
  onSearchChange?: (text: string) => void;
  onClearAll: () => void;
}

interface FilterTag {
  key: string;
  label: string;
  onRemove: () => void;
}

export function TaskFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: TaskFilterTagsProps) {
  const { colors } = useTheme();

  // Load entity data for labels
  const { data: sectorsData } = useSectors({ orderBy: { name: "asc" } });
  const { data: customersData } = useCustomers({ orderBy: { fantasyName: "asc" } });
  const { data: usersData } = useUsers({ orderBy: { name: "asc" } });

  const sectors = sectorsData?.data || [];
  const customers = customersData?.data || [];
  const users = usersData?.data || [];

  // Build array of active filter tags
  const filterTags = useMemo((): FilterTag[] => {
    const tags: FilterTag[] = [];

    // Search text
    if (searchText) {
      tags.push({
        key: "search",
        label: `Busca: "${searchText}"`,
        onRemove: () => onSearchChange?.(""),
      });
    }

    // Status filters
    if (filters.status?.length) {
      filters.status.forEach((status: string, index: number) => {
        const statusLabel = TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS];
        if (statusLabel) {
          tags.push({
            key: `status-${index}`,
            label: `Status: ${statusLabel}`,
            onRemove: () => {
              const newStatus = filters.status.filter((s: string) => s !== status);
              onFilterChange({
                ...filters,
                status: newStatus.length > 0 ? newStatus : undefined,
              });
            },
          });
        }
      });
    }

    // Sector filters
    if (filters.sectorIds?.length) {
      filters.sectorIds.forEach((sectorId: string, index: number) => {
        const sector = sectors.find((s) => s.id === sectorId);
        if (sector) {
          tags.push({
            key: `sector-${index}`,
            label: `Setor: ${sector.name}`,
            onRemove: () => {
              const newSectors = filters.sectorIds.filter((id: string) => id !== sectorId);
              onFilterChange({
                ...filters,
                sectorIds: newSectors.length > 0 ? newSectors : undefined,
              });
            },
          });
        }
      });
    }

    // Customer filters
    if (filters.customerIds?.length) {
      filters.customerIds.forEach((customerId: string, index: number) => {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          tags.push({
            key: `customer-${index}`,
            label: `Cliente: ${customer.fantasyName}`,
            onRemove: () => {
              const newCustomers = filters.customerIds.filter((id: string) => id !== customerId);
              onFilterChange({
                ...filters,
                customerIds: newCustomers.length > 0 ? newCustomers : undefined,
              });
            },
          });
        }
      });
    }

    // Assignee filters
    if (filters.assigneeIds?.length) {
      filters.assigneeIds.forEach((userId: string, index: number) => {
        const user = users.find((u) => u.id === userId);
        if (user) {
          tags.push({
            key: `assignee-${index}`,
            label: `Responsável: ${user.name}`,
            onRemove: () => {
              const newAssignees = filters.assigneeIds.filter((id: string) => id !== userId);
              onFilterChange({
                ...filters,
                assigneeIds: newAssignees.length > 0 ? newAssignees : undefined,
              });
            },
          });
        }
      });
    }

    // Date range filters
    const dateRangeLabels = {
      entryDateRange: "Entrada",
      termRange: "Prazo",
      startedDateRange: "Início",
      finishedDateRange: "Conclusão",
      createdAtRange: "Criação",
      updatedAtRange: "Atualização",
    } as const;

    Object.entries(dateRangeLabels).forEach(([key, label]) => {
      const range = filters[key];
      if (range) {
        const fromStr = range.from ? format(new Date(range.from), "dd/MM/yy", { locale: ptBR }) : "";
        const toStr = range.to ? format(new Date(range.to), "dd/MM/yy", { locale: ptBR }) : "";
        const rangeStr = fromStr && toStr ? `${fromStr} - ${toStr}` : fromStr || toStr;
        tags.push({
          key,
          label: `${label}: ${rangeStr}`,
          onRemove: () => {
            const { [key]: _, ...rest } = filters;
            onFilterChange(rest);
          },
        });
      }
    });

    // Situation filters
    if (filters.isActive !== undefined) {
      tags.push({
        key: "isActive",
        label: `Situação: ${filters.isActive ? "Ativas" : "Inativas"}`,
        onRemove: () => {
          const { isActive, ...rest } = filters;
          onFilterChange(rest);
        },
      });
    }
    if (filters.isCompleted !== undefined) {
      tags.push({
        key: "isCompleted",
        label: "Situação: Finalizadas",
        onRemove: () => {
          const { isCompleted, ...rest } = filters;
          onFilterChange(rest);
        },
      });
    }
    if (filters.isOverdue !== undefined) {
      tags.push({
        key: "isOverdue",
        label: "Situação: Atrasadas",
        onRemove: () => {
          const { isOverdue, ...rest } = filters;
          onFilterChange(rest);
        },
      });
    }

    // Boolean characteristic filters
    const booleanFilterLabels = {
      hasSector: "Tem setor",
      hasCustomer: "Tem cliente",
      hasTruck: "Tem caminhão",
      hasObservation: "Tem observação",
      hasArtworks: "Tem artes",
      hasPaints: "Tem tintas",
      hasCommissions: "Tem comissões",
      hasServiceOrders: "Tem serviços",
      hasAirbrushing: "Tem aerografia",
      hasBudget: "Tem orçamento",
      hasNfe: "Tem NFe",
      hasReceipt: "Tem recibo",
      hasAssignee: "Tem responsável",
    } as const;

    Object.entries(booleanFilterLabels).forEach(([key, label]) => {
      const value = filters[key];
      if (value !== undefined) {
        tags.push({
          key,
          label: `${label}: ${value ? "Sim" : "Não"}`,
          onRemove: () => {
            const { [key]: _, ...rest } = filters;
            onFilterChange(rest);
          },
        });
      }
    });

    // Price range filter
    if (filters.priceRange) {
      const { from, to } = filters.priceRange;
      const rangeStr =
        from && to
          ? `R$ ${from.toFixed(2)} - R$ ${to.toFixed(2)}`
          : from
            ? `≥ R$ ${from.toFixed(2)}`
            : to
              ? `≤ R$ ${to.toFixed(2)}`
              : "";
      tags.push({
        key: "priceRange",
        label: `Valor: ${rangeStr}`,
        onRemove: () => {
          const { priceRange, ...rest } = filters;
          onFilterChange(rest);
        },
      });
    }

    // Sort by filter
    if (filters.sortBy && filters.sortBy !== "term") {
      const sortLabels: Record<string, string> = {
        createdAt: "Data de Criação",
        term: "Prazo",
        priority: "Prioridade",
      };
      tags.push({
        key: "sortBy",
        label: `Ordenar: ${sortLabels[filters.sortBy] || filters.sortBy}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            sortBy: undefined,
          });
        },
      });
    }

    // Sort order filter
    if (filters.sortOrder && filters.sortOrder !== "asc") {
      tags.push({
        key: "sortOrder",
        label: `Ordem: ${filters.sortOrder === "desc" ? "Decrescente" : "Crescente"}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            sortOrder: undefined,
          });
        },
      });
    }

    return tags;
  }, [filters, searchText, onFilterChange, onSearchChange, sectors, customers, users]);

  // Don't render if no active filters
  if (filterTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filterTags.map((tag) => (
          <Badge
            key={tag.key}
            variant="secondary"
            style={StyleSheet.flatten([
              styles.filterTag,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              }
            ])}
          >
            <ThemedText style={[styles.filterTagText, { color: colors.secondaryForeground }]}>
              {tag.label}
            </ThemedText>
            <TouchableOpacity
              onPress={tag.onRemove}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <IconX size={14} color={colors.secondaryForeground} />
            </TouchableOpacity>
          </Badge>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    minHeight: 32,
  },
  filterTagText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
});
