import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconClock, IconTag } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { ACTIVITY_OPERATION, ACTIVITY_OPERATION_LABELS, ACTIVITY_REASON_LABELS } from '@/constants';

interface TeamActivityFilterDrawerContentProps {
  filters: {
    operations?: string[];
    reasons?: string[];
    userIds?: string[];
    itemIds?: string[];
    quantityRange?: { min?: number; max?: number };
    createdAt?: { gte?: Date; lte?: Date };
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function TeamActivityFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: TeamActivityFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});

  const handleToggleOperation = useCallback((operation: string) => {
    setLocalFilters(prev => {
      const operations = prev.operations || [];
      const hasOperation = operations.includes(operation);

      if (hasOperation) {
        const newOperations = operations.filter(op => op !== operation);
        return {
          ...prev,
          operations: newOperations.length > 0 ? newOperations : undefined
        };
      } else {
        return {
          ...prev,
          operations: [...operations, operation]
        };
      }
    });
  }, []);

  const handleToggleReason = useCallback((reason: string) => {
    setLocalFilters(prev => {
      const reasons = prev.reasons || [];
      const hasReason = reasons.includes(reason);

      if (hasReason) {
        const newReasons = reasons.filter(r => r !== reason);
        return {
          ...prev,
          reasons: newReasons.length > 0 ? newReasons : undefined
        };
      } else {
        return {
          ...prev,
          reasons: [...reasons, reason]
        };
      }
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

  // Operation types
  const operationOptions = useMemo(() => [
    {
      key: ACTIVITY_OPERATION.INBOUND,
      label: ACTIVITY_OPERATION_LABELS[ACTIVITY_OPERATION.INBOUND],
      description: 'Entradas no estoque'
    },
    {
      key: ACTIVITY_OPERATION.OUTBOUND,
      label: ACTIVITY_OPERATION_LABELS[ACTIVITY_OPERATION.OUTBOUND],
      description: 'Saídas do estoque'
    }
  ], []);

  // Reason types
  const reasonOptions = useMemo(() =>
    Object.entries(ACTIVITY_REASON_LABELS).map(([key, label]) => ({
      key,
      label,
    }))
  , []);

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
          <ThemedText style={styles.title}>Filtros de Atividades</ThemedText>
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
        {/* Operation Type Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Operação
            </ThemedText>
          </View>

          {operationOptions.map((option) => (
            <View key={option.key} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleToggleOperation(option.key)}
                activeOpacity={0.7}
              >
                <View>
                  <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
                  <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                    {option.description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <RNSwitch
                value={localFilters.operations?.includes(option.key) || false}
                onValueChange={() => handleToggleOperation(option.key)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={localFilters.operations?.includes(option.key) ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Reason Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTag size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Motivo
            </ThemedText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {reasonOptions.map((option) => {
              const isSelected = localFilters.reasons?.includes(option.key) || false;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => handleToggleReason(option.key)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[
                    styles.chipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Quantity Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Quantidade
            </ThemedText>
          </View>

          <View style={styles.rangeInputs}>
            <View style={styles.rangeInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>Mínimo</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.quantityRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const min = value ? parseFloat(value) : undefined;
                  if (min !== undefined && isNaN(min)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      min
                    }
                  }));
                }}
              />
            </View>

            <View style={styles.rangeInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>Máximo</ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="Sem limite"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.quantityRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const max = value ? parseFloat(value) : undefined;
                  if (max !== undefined && isNaN(max)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    quantityRange: {
                      ...prev.quantityRange,
                      max
                    }
                  }));
                }}
              />
            </View>
          </View>
        </View>

        {/* Date Range - Simplified for mobile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconClock size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <ThemedText style={[styles.helperText, { color: colors.mutedForeground }]}>
            Use a busca na tela principal para filtrar por período específico
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
  chipContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
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
  rangeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
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
