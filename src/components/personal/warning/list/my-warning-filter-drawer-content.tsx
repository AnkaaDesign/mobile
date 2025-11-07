import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconAlertCircle, IconCalendarPlus, IconTags } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { WARNING_SEVERITY, WARNING_CATEGORY, WARNING_SEVERITY_LABELS, WARNING_CATEGORY_LABELS } from '@/constants';

interface MyWarningFilterDrawerContentProps {
  filters: {
    severity?: string[];
    category?: string[];
    isActive?: boolean;
    followUpDate?: { gte?: Date; lte?: Date };
    createdAt?: { gte?: Date; lte?: Date };
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function MyWarningFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: MyWarningFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const handleClose = onClose || closeFilterDrawer;
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  const handleToggle = useCallback((key: string, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleToggleSeverity = useCallback((severity: string) => {
    setLocalFilters(prev => {
      const currentSeverities = prev.severity || [];
      const newSeverities = currentSeverities.includes(severity)
        ? currentSeverities.filter(s => s !== severity)
        : [...currentSeverities, severity];

      return {
        ...prev,
        severity: newSeverities.length > 0 ? newSeverities : undefined
      };
    });
  }, []);

  const handleToggleCategory = useCallback((category: string) => {
    setLocalFilters(prev => {
      const currentCategories = prev.category || [];
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];

      return {
        ...prev,
        category: newCategories.length > 0 ? newCategories : undefined
      };
    });
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  // Severity options
  const severityOptions = useMemo(() => {
    return Object.values(WARNING_SEVERITY).map(severity => ({
      value: severity,
      label: WARNING_SEVERITY_LABELS[severity as keyof typeof WARNING_SEVERITY_LABELS],
      checked: localFilters.severity?.includes(severity) || false,
    }));
  }, [localFilters.severity]);

  // Category options
  const categoryOptions = useMemo(() => {
    return Object.values(WARNING_CATEGORY).map(category => ({
      value: category,
      label: WARNING_CATEGORY_LABELS[category as keyof typeof WARNING_CATEGORY_LABELS],
      checked: localFilters.category?.includes(category) || false,
    }));
  }, [localFilters.category]);

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
          <ThemedText style={styles.title}>Filtros de Advertências</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Severity Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Gravidade
            </ThemedText>
          </View>

          {severityOptions.map((option) => (
            <View key={option.value} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleToggleSeverity(option.value)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
              <RNSwitch
                value={option.checked}
                onValueChange={() => handleToggleSeverity(option.value)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={option.checked ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Category Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTags size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Categoria
            </ThemedText>
          </View>

          {categoryOptions.map((option) => (
            <View key={option.value} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleToggleCategory(option.value)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
              <RNSwitch
                value={option.checked}
                onValueChange={() => handleToggleCategory(option.value)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={option.checked ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Status Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertCircle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => handleToggle('isActive', localFilters.isActive === undefined ? true : !localFilters.isActive)}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Ativas</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar somente advertências ativas
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.isActive === true}
              onValueChange={(value) => handleToggle('isActive', value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.isActive ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Date Range Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Criação
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Data Inicial</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.createdAt?.gte ? new Date(localFilters.createdAt.gte).toLocaleDateString('pt-BR') : ""}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Data Final</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.createdAt?.lte ? new Date(localFilters.createdAt.lte).toLocaleDateString('pt-BR') : ""}
              editable={false}
            />
          </View>

          <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
            Nota: A seleção de datas será implementada em breve
          </ThemedText>
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
    marginBottom: 8,
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
    borderBottomWidth: 1,
  },
  filterTouchable: {
    flex: 1,
    paddingRight: 16,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  filterDescription: {
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 8,
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
