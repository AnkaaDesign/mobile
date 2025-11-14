import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { useUsers } from "@/hooks";
import { WARNING_CATEGORY, WARNING_SEVERITY, WARNING_CATEGORY_LABELS, WARNING_SEVERITY_LABELS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import type { WarningGetManyFormData } from '../../../../schemas';

interface WarningFilterDrawerV2Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<WarningGetManyFormData>) => void;
  currentFilters: Partial<WarningGetManyFormData>;
}

interface FilterState {
  isActive?: boolean;
  collaboratorIds?: string[];
  supervisorIds?: string[];
  categories?: string[];
  severities?: string[];
  createdDateRange?: { start?: Date; end?: Date };
  followUpDateRange?: { start?: Date; end?: Date };
}

type SectionKey = "status" | "categories" | "severities" | "entities";

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

export function WarningFilterDrawerV2({ visible, onClose, onApply, currentFilters }: WarningFilterDrawerV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status", "categories", "severities"])
  );

  const shouldLoadEntities = expandedSections.has("entities");

  const { data: usersData } = useUsers({
    limit: 100,
    orderBy: { name: "asc" },
    enabled: shouldLoadEntities
  });

  const users = usersData?.data || [];

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.isActive === false) count++;
    if (filters.collaboratorIds?.length) count++;
    if (filters.supervisorIds?.length) count++;
    if (filters.categories?.length) count++;
    if (filters.severities?.length) count++;
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) count++;
    if (filters.followUpDateRange?.start || filters.followUpDateRange?.end) count++;
    return count;
  }, [filters]);

  const handleToggle = useCallback((key: keyof FilterState, value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'isActive' ? value : (value || undefined),
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
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
          const cleanObj = Object.entries(value).reduce((objAcc, [objKey, objValue]) => {
            if (objValue !== undefined && objValue !== null && objValue !== "") {
              objAcc[objKey] = objValue;
            }
            return objAcc;
          }, {} as any);
          if (Object.keys(cleanObj).length > 0) {
            acc[key] = cleanObj;
          }
        } else if (value !== "") {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as any);

    // Transform date ranges
    if (filters.createdDateRange?.start || filters.createdDateRange?.end) {
      cleanFilters.createdAt = {
        ...(filters.createdDateRange.start && { gte: filters.createdDateRange.start }),
        ...(filters.createdDateRange.end && { lte: filters.createdDateRange.end }),
      };
      delete cleanFilters.createdDateRange;
    }
    if (filters.followUpDateRange?.start || filters.followUpDateRange?.end) {
      cleanFilters.followUpDate = {
        ...(filters.followUpDateRange.start && { gte: filters.followUpDateRange.start }),
        ...(filters.followUpDateRange.end && { lte: filters.followUpDateRange.end }),
      };
      delete cleanFilters.followUpDateRange;
    }

    onApply(cleanFilters);
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
          <View style={styles.row}>
            <Label style={styles.label}>Apenas ativas</Label>
            <RNSwitch
              value={filters.isActive !== false}
              onValueChange={(value) => handleToggle("isActive", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={filters.isActive !== false ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>
      ),
    },
    {
      key: "categories" as const,
      title: "Categorias",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Combobox
              options={Object.values(WARNING_CATEGORY).map((category) => ({
                label: WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS] || category,
                value: category,
              }))}
              selectedValues={filters.categories || []}
              onValueChange={(value) => handleArrayChange("categories", value)}
              placeholder="Selecione"
              showBadges={false}
            />
          </View>
        </View>
      ),
    },
    {
      key: "severities" as const,
      title: "Severidades",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Combobox
              options={Object.values(WARNING_SEVERITY).map((severity) => ({
                label: WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS] || severity,
                value: severity,
              }))}
              selectedValues={filters.severities || []}
              onValueChange={(value) => handleArrayChange("severities", value)}
              placeholder="Selecione"
              showBadges={false}
            />
          </View>
        </View>
      ),
    },
    {
      key: "entities" as const,
      title: "Colaboradores e Supervisores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Colaboradores</Label>
            <Combobox
              options={users.map((user) => ({ label: user.name, value: user.id }))}
              selectedValues={filters.collaboratorIds || []}
              onValueChange={(value) => handleArrayChange("collaboratorIds", value)}
              placeholder={users.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={users.length === 0}
            />
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Supervisores</Label>
            <Combobox
              options={users.map((user) => ({ label: user.name, value: user.id }))}
              selectedValues={filters.supervisorIds || []}
              onValueChange={(value) => handleArrayChange("supervisorIds", value)}
              placeholder={users.length === 0 ? "Carregando..." : "Selecione"}
              showBadges={false}
              disabled={users.length === 0}
            />
          </View>
        </View>
      ),
    },
  ], [filters, users, colors, handleToggle, handleArrayChange]);

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
