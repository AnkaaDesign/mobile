import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { IconFilter, IconX, IconCheck } from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { useUtilityDrawer } from "@/contexts/utility-drawer-context";
import { spacing } from "@/constants/design-system";
import { FilterSection } from "@/components/common/filters/FilterSection";
import { SelectFilter, DateRangeFilter, type DateRange } from "@/components/common/filters";
import { CUT_STATUS, CUT_TYPE, CUT_ORIGIN } from "../../../../constants";
import { CUT_STATUS_LABELS, CUT_TYPE_LABELS, CUT_ORIGIN_LABELS } from "../../../../constants";
import type { CutGetManyFormData } from "../../../../schemas";
import { Separator } from "@/components/ui/separator";

interface CuttingPlanFilterDrawerContentProps {
  filters: Partial<CutGetManyFormData>;
  onFilterChange: (filters: Partial<CutGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function CuttingPlanFilterDrawerContent({
  filters,
  onFilterChange,
  onClear,
  activeFiltersCount,
  onClose,
}: CuttingPlanFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize local filters with current filters
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  // Extract filter values from the local filters object
  const status = localFilters.where?.status as CUT_STATUS | undefined;
  const type = localFilters.where?.type as CUT_TYPE | undefined;
  const origin = localFilters.where?.origin as CUT_ORIGIN | undefined;
  const startedAfter = localFilters.where?.startedAt?.gte;
  const startedBefore = localFilters.where?.startedAt?.lte;
  const completedAfter = localFilters.where?.completedAt?.gte;
  const completedBefore = localFilters.where?.completedAt?.lte;

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
      setLocalFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters.where) newFilters.where = {};
        if (value) {
          newFilters.where.status = value as CUT_STATUS;
        } else {
          delete newFilters.where.status;
        }
        return newFilters;
      });
    },
    [],
  );

  const handleTypeChange = useCallback(
    (value: string | undefined) => {
      setLocalFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters.where) newFilters.where = {};
        if (value) {
          newFilters.where.type = value as CUT_TYPE;
        } else {
          delete newFilters.where.type;
        }
        return newFilters;
      });
    },
    [],
  );

  const handleOriginChange = useCallback(
    (value: string | undefined) => {
      setLocalFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters.where) newFilters.where = {};
        if (value) {
          newFilters.where.origin = value as CUT_ORIGIN;
        } else {
          delete newFilters.where.origin;
        }
        return newFilters;
      });
    },
    [],
  );

  const handleStartedDateChange = useCallback(
    (range: DateRange | undefined) => {
      setLocalFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters.where) newFilters.where = {};
        if (range?.from || range?.to) {
          newFilters.where.startedAt = {
            ...(range.from && { gte: range.from }),
            ...(range.to && { lte: range.to }),
          };
        } else {
          delete newFilters.where.startedAt;
        }
        return newFilters;
      });
    },
    [],
  );

  const handleCompletedDateChange = useCallback(
    (range: DateRange | undefined) => {
      setLocalFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters.where) newFilters.where = {};
        if (range?.from || range?.to) {
          newFilters.where.completedAt = {
            ...(range.from && { gte: range.from }),
            ...(range.to && { lte: range.to }),
          };
        } else {
          delete newFilters.where.completedAt;
        }
        return newFilters;
      });
    },
    [],
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
              value={{ from: startedAfter, to: startedBefore }}
              onChange={handleStartedDateChange}
            />
            <DateRangeFilter
              label="Data de Conclusão"
              value={{ from: completedAfter, to: completedBefore }}
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

  const handleApply = useCallback(() => {
    onFilterChange(localFilters);
    onClose ? onClose() : closeFilterDrawer();
  }, [localFilters, onFilterChange, onClose, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: 18,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Filtros de Cortes</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
      >
        <View style={styles.contentContainer}>
          {filterSections.map((section, index) => (
            <React.Fragment key={section.id}>
              <FilterSection
                title={section.title}
                description={section.description}
                defaultOpen={section.defaultOpen}
                badge={section.badge}
              >
                {section.content}
              </FilterSection>
              {index < filterSections.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleClear}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.footerBtnText}>Limpar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={handleApply}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.footerBtnText, { color: colors.primaryForeground }]}>Aplicar</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  contentContainer: {
    gap: spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
