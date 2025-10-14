import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { IconChevronDown, IconChevronRight, IconX, IconFilter } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { BRAZILIAN_STATES } from '../../../../constants';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Switch } from "@/components/ui/switch";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import type { SupplierGetManyFormData } from '../../../../schemas';

interface SupplierFilterDrawerProps {
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
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

type SectionKey = "status" | "location" | "ranges";

interface FilterSection {
  key: SectionKey;
  title: string;
  component: React.ReactNode;
}

// Memoized section header component
const SectionHeader = React.memo<{
  title: string;
  isExpanded: boolean;
  onPress: () => void;
  colors: any;
}>(({ title, isExpanded, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    {isExpanded ? (
      <IconChevronDown size={20} color={colors.foreground} />
    ) : (
      <IconChevronRight size={20} color={colors.foreground} />
    )}
  </TouchableOpacity>
));

SectionHeader.displayName = "SectionHeader";

export function SupplierFilterDrawer({ visible, onClose, onApply, currentFilters }: SupplierFilterDrawerProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>(currentFilters || {});
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(["status"])
  );

  // Reset filters when drawer opens
  useEffect(() => {
    if (visible) {
      setFilters(currentFilters || {});
    }
  }, [currentFilters, visible]);

  // Calculate active filter count
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

  // Build sections with content
  const sections: FilterSection[] = useMemo(() => [
    {
      key: "status" as const,
      title: "Status e Características",
      component: (
        <View style={styles.sectionContent}>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui logo</Label>
            <Switch
              checked={!!filters.hasLogo}
              onCheckedChange={(value) => handleToggle("hasLogo", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui produtos</Label>
            <Switch
              checked={!!filters.hasItems}
              onCheckedChange={(value) => handleToggle("hasItems", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui pedidos</Label>
            <Switch
              checked={!!filters.hasOrders}
              onCheckedChange={(value) => handleToggle("hasOrders", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui pedidos ativos</Label>
            <Switch
              checked={!!filters.hasActiveOrders}
              onCheckedChange={(value) => handleToggle("hasActiveOrders", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui CNPJ</Label>
            <Switch
              checked={!!filters.hasCnpj}
              onCheckedChange={(value) => handleToggle("hasCnpj", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui email</Label>
            <Switch
              checked={!!filters.hasEmail}
              onCheckedChange={(value) => handleToggle("hasEmail", value)}
            />
          </View>
          <View style={styles.switchOption}>
            <Label style={styles.optionLabel}>Possui site</Label>
            <Switch
              checked={!!filters.hasSite}
              onCheckedChange={(value) => handleToggle("hasSite", value)}
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
          <View style={styles.entitySection}>
            <Label style={styles.entityLabel}>Estados</Label>
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
          <View style={styles.rangeSection}>
            <Label style={styles.rangeLabel}>Quantidade de Produtos</Label>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={filters.itemCount?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("itemCount", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeTo, { color: colors.mutedForeground }]}>até</ThemedText>
              <Input
                placeholder="Máx"
                value={filters.itemCount?.max?.toString() || ""}
                onChangeText={(value) => handleRangeChange("itemCount", "max", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
            </View>
          </View>
          <View style={styles.rangeSection}>
            <Label style={styles.rangeLabel}>Quantidade de Pedidos</Label>
            <View style={styles.rangeInputs}>
              <Input
                placeholder="Mín"
                value={filters.orderCount?.min?.toString() || ""}
                onChangeText={(value) => handleRangeChange("orderCount", "min", value)}
                keyboardType="numeric"
                style={styles.rangeInput}
              />
              <ThemedText style={[styles.rangeTo, { color: colors.mutedForeground }]}>até</ThemedText>
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
      <View style={styles.section}>
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
      closeOnSwipe={true}
    >
      <View style={styles.drawerContainer}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={styles.headerTitle}>Filtros</ThemedText>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Filter sections list */}
        <View style={styles.listContainer}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footerContainer, { borderTopColor: colors.border }]}>
          <View style={styles.footer}>
            <Button
              variant="outline"
              size="default"
              onPress={handleClear}
              style={styles.footerButton}
              disabled={activeFilterCount === 0}
            >
              {activeFilterCount > 0 ? `Limpar (${activeFilterCount})` : "Limpar"}
            </Button>
            <Button
              variant="default"
              size="default"
              onPress={handleApply}
              style={styles.footerButton}
            >
              Aplicar
            </Button>
          </View>
        </View>
      </View>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    padding: spacing.xs,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  section: {
    marginVertical: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  switchOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  optionLabel: {
    fontSize: fontSize.base,
    flex: 1,
  },
  entitySection: {
    gap: spacing.sm,
  },
  entityLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rangeSection: {
    gap: spacing.sm,
  },
  rangeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rangeInput: {
    flex: 1,
  },
  rangeTo: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.xs,
  },
  separator: {
    marginVertical: spacing.sm,
  },
  footerContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
  },
});
