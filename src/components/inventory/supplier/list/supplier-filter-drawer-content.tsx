import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconBuilding, IconMapPin, IconHash } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BRAZILIAN_STATES } from '@/constants';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';

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

interface SupplierFilterDrawerContentProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

export function SupplierFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: SupplierFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  const handleApply = useCallback(() => {
    const cleanFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
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

    onFiltersChange(cleanFilters);
    closeFilterDrawer();
  }, [localFilters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleToggle = useCallback((key: keyof FilterState, value: boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  const handleArrayChange = useCallback((key: keyof FilterState, value: string[]) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : undefined,
    }));
  }, []);

  const handleRangeChange = useCallback((key: keyof FilterState, field: "min" | "max", value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    setLocalFilters((prev) => ({
      ...prev,
      [key]: {
        ...((prev[key] as FilterRange) || {}),
        [field]: numValue,
      },
    }));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
        paddingTop: 18
      }]}>
        <View style={styles.headerContent}>
          <IconFilter size={24} color={colors.foreground} />
          <ThemedText style={styles.title}>Filtros de Fornecedores</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={closeFilterDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Status e Características */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBuilding size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status e Características
            </ThemedText>
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui logo</Label>
            <RNSwitch
              value={!!localFilters.hasLogo}
              onValueChange={(value) => handleToggle("hasLogo", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasLogo ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui produtos</Label>
            <RNSwitch
              value={!!localFilters.hasItems}
              onValueChange={(value) => handleToggle("hasItems", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasItems ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui pedidos</Label>
            <RNSwitch
              value={!!localFilters.hasOrders}
              onValueChange={(value) => handleToggle("hasOrders", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasOrders ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui pedidos ativos</Label>
            <RNSwitch
              value={!!localFilters.hasActiveOrders}
              onValueChange={(value) => handleToggle("hasActiveOrders", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasActiveOrders ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui CNPJ</Label>
            <RNSwitch
              value={!!localFilters.hasCnpj}
              onValueChange={(value) => handleToggle("hasCnpj", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasCnpj ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui email</Label>
            <RNSwitch
              value={!!localFilters.hasEmail}
              onValueChange={(value) => handleToggle("hasEmail", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasEmail ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={styles.filterItem}>
            <Label style={styles.filterLabel}>Possui site</Label>
            <RNSwitch
              value={!!localFilters.hasSite}
              onValueChange={(value) => handleToggle("hasSite", value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={!!localFilters.hasSite ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Localização */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconMapPin size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Localização
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Estados
            </ThemedText>
            <Combobox
              options={BRAZILIAN_STATES.map((state) => ({ label: state, value: state }))}
              selectedValues={localFilters.states || []}
              onValueChange={(value) => handleArrayChange("states", value)}
              placeholder="Selecione estados"
              showBadges={false}
            />
          </View>
        </View>

        {/* Faixas de Valores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconHash size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Faixas de Valores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Quantidade de Produtos
            </ThemedText>
            <View style={styles.rangeInputs}>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Mínimo</ThemedText>
                <Input
                  placeholder="0"
                  value={localFilters.itemCount?.min?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("itemCount", "min", value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Máximo</ThemedText>
                <Input
                  placeholder="999"
                  value={localFilters.itemCount?.max?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("itemCount", "max", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Quantidade de Pedidos
            </ThemedText>
            <View style={styles.rangeInputs}>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Mínimo</ThemedText>
                <Input
                  placeholder="0"
                  value={localFilters.orderCount?.min?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("orderCount", "min", value)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.rangeInput}>
                <ThemedText style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Máximo</ThemedText>
                <Input
                  placeholder="999"
                  value={localFilters.orderCount?.max?.toString() || ""}
                  onChangeText={(value) => handleRangeChange("orderCount", "max", value)}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
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
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    minHeight: 44,
  },
  filterLabel: {
    fontSize: 15,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
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
