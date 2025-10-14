import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { usePositions, useSectors } from '../../../../hooks';
import { USER_STATUS, USER_STATUS_LABELS } from '../../../../constants';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import type { UserGetManyFormData } from '../../../../schemas';

interface EmployeeFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<UserGetManyFormData>) => void;
  currentFilters: Partial<UserGetManyFormData>;
}

interface FilterState {
  statuses?: string[];
  positionIds?: string[];
  sectorIds?: string[];
  verified?: boolean;
}

type SectionKey = "status" | "entities" | "verification";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

const SectionHeader = React.memo<{
  title: string;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}>(({ title, isExpanded, onPress, colors }) => (
  <TouchableOpacity style={styles.sectionHeader} onPress={onPress} activeOpacity={0.7}>
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    {isExpanded ? (
      <IconChevronDown size={20} color={colors.foreground} />
    ) : (
      <IconChevronRight size={20} color={colors.foreground} />
    )}
  </TouchableOpacity>
));

SectionHeader.displayName = "SectionHeader";

export function EmployeeFilterDrawer({ visible, onClose, onApply, currentFilters }: EmployeeFilterDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status", "entities"])
  );

  const shouldLoadEntities = expandedSections.has("entities");

  const { data: positionsData } = usePositions({
    limit: 100,
    orderBy: { name: "asc" },
    enabled: shouldLoadEntities
  });
  const { data: sectorsData } = useSectors({
    limit: 100,
    orderBy: { name: "asc" },
    enabled: shouldLoadEntities
  });

  const positions = positionsData?.data || [];
  const sectors = sectorsData?.data || [];

  useEffect(() => {
    if (visible) {
      // Parse current filters from where clause
      const parsedFilters: FilterState = {};
      if (currentFilters.where) {
        const where = currentFilters.where as any;
        if (where.status?.in) {
          parsedFilters.statuses = where.status.in;
        }
        if (where.positionId?.in) {
          parsedFilters.positionIds = where.positionId.in;
        }
        if (where.sectorId?.in) {
          parsedFilters.sectorIds = where.sectorId.in;
        }
        if (where.verified !== undefined) {
          parsedFilters.verified = where.verified;
        }
      }
      setFilters(parsedFilters);
    }
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses?.length) count++;
    if (filters.positionIds?.length) count++;
    if (filters.sectorIds?.length) count++;
    if (filters.verified !== undefined) count++;
    return count;
  }, [filters]);

  const handleToggle = useCallback((key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const handleArrayChange = useCallback((key: keyof FilterState, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  }, []);

  const toggleSection = useCallback((sectionKey: SectionKey) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  const handleApply = useCallback(() => {
    const where: any = {};

    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }
    if (filters.positionIds?.length) {
      where.positionId = { in: filters.positionIds };
    }
    if (filters.sectorIds?.length) {
      where.sectorId = { in: filters.sectorIds };
    }
    if (filters.verified !== undefined) {
      where.verified = filters.verified;
    }

    const queryFilters: Partial<UserGetManyFormData> = {};
    if (Object.keys(where).length > 0) {
      queryFilters.where = where;
    }

    onApply(queryFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Status do Colaborador</Label>
            <MultiCombobox
              options={Object.values(USER_STATUS).map((status) => ({
                label: USER_STATUS_LABELS[status],
                value: status,
              }))}
              selectedValues={filters.statuses || []}
              onValueChange={(value) => handleArrayChange("statuses", value)}
              placeholder="Selecione"
              showBadges={false}
            />
          </View>
        </View>
      ),
    },
    {
      key: "entities" as const,
      title: "Cargo e Setor",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Cargos</Label>
            <MultiCombobox
              options={positions.map((position) => ({
                label: position.name,
                value: position.id,
              }))}
              selectedValues={filters.positionIds || []}
              onValueChange={(value) => handleArrayChange("positionIds", value)}
              placeholder={positions.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={positions.length === 0}
            />
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Setores</Label>
            <MultiCombobox
              options={sectors.map((sector) => ({
                label: sector.name,
                value: sector.id,
              }))}
              selectedValues={filters.sectorIds || []}
              onValueChange={(value) => handleArrayChange("sectorIds", value)}
              placeholder={sectors.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={sectors.length === 0}
            />
          </View>
        </View>
      ),
    },
    {
      key: "verification" as const,
      title: "Verificação",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Label style={styles.label}>Apenas verificados</Label>
            <RNSwitch
              value={!!filters.verified}
              onValueChange={(value) => handleToggle("verified", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.verified ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>
      ),
    },
  ], [filters, positions, sectors, colors, handleToggle, handleArrayChange]);

  const renderSection = useCallback(({ item }: { item: FilterSection }) => {
    const isExpanded = expandedSections.has(item.key);

    return (
      <View>
        <SectionHeader
          title={item.title}
          isExpanded={isExpanded}
          onPress={() => toggleSection(item.key)}
          colors={colors}
        />
        {isExpanded && item.component}
        <Separator style={styles.separator} />
      </View>
    );
  }, [expandedSections, toggleSection, colors]);

  const keyExtractor = useCallback((item: FilterSection) => item.key, []);

  return (
    <Drawer
      open={visible}
      onOpenChange={onClose}
      side="right"
      width="90%"
      closeOnBackdropPress={true}
      closeOnSwipe={false}
      style={{ borderTopWidth: 0 }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8
        }]}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.title}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* List */}
        <View style={styles.listWrapper}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 16)
        }]}>
          <Button
            variant="outline"
            size="default"
            onPress={handleClear}
            style={styles.btn}
            disabled={activeFilterCount === 0}
          >
            {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
          </Button>
          <Button variant="default" size="default" onPress={handleApply} style={styles.btn}>
            Aplicar
          </Button>
        </View>
      </View>
    </Drawer>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderTopWidth: 0,
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
  listWrapper: {
    flex: 1,
  },
  list: {
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    marginVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
  },
});
