import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '../../../../constants';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import type { CustomerGetManyFormData } from '../../../../schemas';

interface CustomerFilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<CustomerGetManyFormData>) => void;
  currentFilters: Partial<CustomerGetManyFormData>;
}

interface FilterState {
  states?: string[];
  city?: string;
  tags?: string[];
  hasCNPJ?: boolean;
  hasCPF?: boolean;
  hasTasks?: boolean;
  taskCount?: number;
}

type SectionKey = "location" | "document" | "tags" | "tasks";

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

export function CustomerFilterDrawer({ visible, onClose, onApply, currentFilters }: CustomerFilterDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["location"])
  );

  // Extract filters from where clause
  useEffect(() => {
    if (visible) {
      const where = currentFilters.where as any;
      const extracted: FilterState = {};

      if (where) {
        if (where.state?.in) extracted.states = where.state.in;
        if (where.city?.contains) extracted.city = where.city.contains;
        if (where.tags?.hasSome) extracted.tags = where.tags.hasSome;
        if (where.cnpj?.not === null) extracted.hasCNPJ = true;
        if (where.cpf?.not === null) extracted.hasCPF = true;
      }

      // Extract from convenience filters
      if (currentFilters.hasTasks !== undefined) {
        extracted.hasTasks = currentFilters.hasTasks;
      }
      if (currentFilters.taskCount !== undefined) {
        extracted.taskCount = currentFilters.taskCount;
      }

      setFilters(extracted);
    }
  }, [currentFilters, visible]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.states?.length) count++;
    if (filters.city) count++;
    if (filters.tags?.length) count++;
    if (filters.hasCNPJ) count++;
    if (filters.hasCPF) count++;
    if (filters.hasTasks !== undefined) count++;
    if (filters.taskCount !== undefined) count++;
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

  const handleTextChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const handleNumberChange = useCallback((key: keyof FilterState, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setFilters((prev) => ({
      ...prev,
      [key]: numValue,
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

    // Build where clause
    if (filters.states?.length) {
      where.state = { in: filters.states };
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.hasCNPJ) {
      where.cnpj = { not: null };
    }

    if (filters.hasCPF) {
      where.cpf = { not: null };
    }

    const apiFilters: Partial<CustomerGetManyFormData> = {};
    if (Object.keys(where).length > 0) {
      apiFilters.where = where;
    }

    // Add convenience filters
    if (filters.hasTasks !== undefined) {
      apiFilters.hasTasks = filters.hasTasks;
    }

    if (filters.taskCount !== undefined) {
      apiFilters.taskCount = filters.taskCount;
    }

    onApply(apiFilters);
    onClose();
  }, [filters, onApply, onClose]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  // State options
  const stateOptions = useMemo(() =>
    BRAZILIAN_STATES.map((state) => ({
      value: state,
      label: BRAZILIAN_STATE_NAMES[state] || state,
    })),
    []
  );

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "location" as const,
      title: "Localização",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Estados</Label>
            <MultiCombobox
              options={stateOptions}
              selectedValues={filters.states || []}
              onValueChange={(value) => handleArrayChange("states", value)}
              placeholder="Selecione estados"
              showBadges={false}
            />
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Cidade</Label>
            <Input
              value={filters.city || ""}
              onChangeText={(value) => handleTextChange("city", value)}
              placeholder="Digite o nome da cidade"
            />
          </View>
        </View>
      ),
    },
    {
      key: "document" as const,
      title: "Documentos",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Label style={styles.label}>Possui CNPJ</Label>
            <RNSwitch
              value={!!filters.hasCNPJ}
              onValueChange={(value) => handleToggle("hasCNPJ", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasCNPJ ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui CPF</Label>
            <RNSwitch
              value={!!filters.hasCPF}
              onValueChange={(value) => handleToggle("hasCPF", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasCPF ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>
      ),
    },
    {
      key: "tags" as const,
      title: "Tags",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Tags (separadas por vírgula)</Label>
            <Input
              value={filters.tags?.join(", ") || ""}
              onChangeText={(value) => handleArrayChange("tags", value ? value.split(",").map(t => t.trim()).filter(Boolean) : [])}
              placeholder="Ex: importante, vip, premium"
            />
          </View>
        </View>
      ),
    },
    {
      key: "tasks" as const,
      title: "Tarefas",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Label style={styles.label}>Possui Tarefas</Label>
            <RNSwitch
              value={!!filters.hasTasks}
              onValueChange={(value) => handleToggle("hasTasks", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasTasks ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Número de Tarefas</Label>
            <Input
              value={filters.taskCount?.toString() || ""}
              onChangeText={(value) => handleNumberChange("taskCount", value)}
              placeholder="Ex: 5"
              keyboardType="numeric"
            />
          </View>
        </View>
      ),
    },
  ], [filters, stateOptions, colors, handleToggle, handleArrayChange, handleTextChange, handleNumberChange]);

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
