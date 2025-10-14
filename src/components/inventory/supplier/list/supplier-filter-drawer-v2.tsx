import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet, Switch as RNSwitch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES } from '../../../../constants';
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Drawer } from "@/components/ui/drawer";
import type { SupplierGetManyFormData } from '../../../../schemas';

interface SupplierFilterDrawerV2Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Partial<SupplierGetManyFormData>) => void;
  currentFilters: Partial<SupplierGetManyFormData>;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  hasLogo?: boolean;
  hasItems?: boolean;
  hasOrders?: boolean;
  hasActiveOrders?: boolean;
  hasCnpj?: boolean;
  hasEmail?: boolean;
  hasSite?: boolean;
  states?: string[];
  itemCount?: FilterRange;
  orderCount?: FilterRange;
}

type SectionKey = "status" | "location" | "ranges";

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

export function SupplierFilterDrawerV2({ visible, onClose, onApply, currentFilters }: SupplierFilterDrawerV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status"])
  );

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.hasLogo) count++;
    if (filters.hasItems) count++;
    if (filters.hasOrders) count++;
    if (filters.hasActiveOrders) count++;
    if (filters.hasCnpj) count++;
    if (filters.hasEmail) count++;
    if (filters.hasSite) count++;
    if (filters.states?.length) count++;
    if (filters.itemCount?.min !== undefined || filters.itemCount?.max !== undefined) count++;
    if (filters.orderCount?.min !== undefined || filters.orderCount?.max !== undefined) count++;
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

  const handleRangeChange = useCallback((key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: numValue,
      },
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

    onApply(cleanFilters);
  }, [filters, onApply]);

  const handleClear = useCallback(() => {
    setFilters({});
  }, []);

  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status e Características",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.row}>
            <Label style={styles.label}>Possui logo</Label>
            <RNSwitch
              value={!!filters.hasLogo}
              onValueChange={(value) => handleToggle("hasLogo", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasLogo ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui produtos</Label>
            <RNSwitch
              value={!!filters.hasItems}
              onValueChange={(value) => handleToggle("hasItems", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasItems ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui pedidos</Label>
            <RNSwitch
              value={!!filters.hasOrders}
              onValueChange={(value) => handleToggle("hasOrders", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasOrders ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui pedidos ativos</Label>
            <RNSwitch
              value={!!filters.hasActiveOrders}
              onValueChange={(value) => handleToggle("hasActiveOrders", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasActiveOrders ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui CNPJ</Label>
            <RNSwitch
              value={!!filters.hasCnpj}
              onValueChange={(value) => handleToggle("hasCnpj", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasCnpj ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui email</Label>
            <RNSwitch
              value={!!filters.hasEmail}
              onValueChange={(value) => handleToggle("hasEmail", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasEmail ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Possui site</Label>
            <RNSwitch
              value={!!filters.hasSite}
              onValueChange={(value) => handleToggle("hasSite", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!filters.hasSite ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>
      ),
    },
    {
      key: "location" as const,
      title: "Localização",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Estados</Label>
            <MultiCombobox
              options={BRAZILIAN_STATES.map((state) => ({ label: state, value: state }))}
              selectedValues={filters.states || []}
              onValueChange={(value) => handleArrayChange("states", value)}
              placeholder="Selecione"
              showBadges={false}
            />
          </View>
        </View>
      ),
    },
    {
      key: "ranges" as const,
      title: "Faixas de Valores",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Quantidade de Produtos</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Mín"
                value={filters.itemCount?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("itemCount", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.itemCount?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("itemCount", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Quantidade de Pedidos</Label>
            <View style={styles.rangeRow}>
              <Input
                placeholder="Mín"
                value={filters.orderCount?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("orderCount", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeText, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.orderCount?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("orderCount", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
        </View>
      ),
    },
  ], [filters, colors, handleToggle, handleArrayChange, handleRangeChange]);

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
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rangeInput: {
    flex: 1,
  },
  rangeText: {
    fontSize: 14,
    paddingHorizontal: 8,
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
