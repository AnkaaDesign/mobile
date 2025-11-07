import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconPackage, IconCalendarEvent, IconAlertTriangle } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Badge } from '@/components/ui/badge';
import { BORROW_STATUS, BORROW_STATUS_LABELS } from '@/constants';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';

interface MyBorrowFilterDrawerContentProps {
  filters: {
    status?: string[];
    itemType?: string;
    dateRange?: { start?: Date; end?: Date };
    showOverdueOnly?: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function MyBorrowFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: MyBorrowFilterDrawerContentProps) {
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

  const handleStatusToggle = useCallback((status: string) => {
    setLocalFilters(prev => {
      const currentStatuses = prev.status || [];
      const hasStatus = currentStatuses.includes(status);

      if (hasStatus) {
        // Remove status
        const newStatuses = currentStatuses.filter(s => s !== status);
        return {
          ...prev,
          status: newStatuses.length > 0 ? newStatuses : undefined
        };
      } else {
        // Add status
        return {
          ...prev,
          status: [...currentStatuses, status]
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

  // Status filter options
  const statusOptions = useMemo(() => [
    {
      key: BORROW_STATUS.ACTIVE,
      label: BORROW_STATUS_LABELS[BORROW_STATUS.ACTIVE],
      description: 'Empréstimos ativos no momento'
    },
    {
      key: BORROW_STATUS.RETURNED,
      label: BORROW_STATUS_LABELS[BORROW_STATUS.RETURNED],
      description: 'Empréstimos já devolvidos'
    },
    {
      key: BORROW_STATUS.LOST,
      label: BORROW_STATUS_LABELS[BORROW_STATUS.LOST],
      description: 'Itens perdidos ou extraviados'
    }
  ], []);

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
          <ThemedText style={styles.title}>Filtros de Empréstimos</ThemedText>
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
        {/* Status Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status do Empréstimo
            </ThemedText>
          </View>

          {statusOptions.map((option) => {
            const isSelected = localFilters.status?.includes(option.key);
            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterItem, { borderBottomColor: colors.border }]}
                onPress={() => handleStatusToggle(option.key)}
                activeOpacity={0.7}
              >
                <View style={styles.filterTouchable}>
                  <ThemedText style={styles.filterLabel}>{option.label}</ThemedText>
                  <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                    {option.description}
                  </ThemedText>
                </View>
                <RNSwitch
                  value={isSelected}
                  onValueChange={() => handleStatusToggle(option.key)}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor={isSelected ? colors.primaryForeground : "#f4f3f4"}
                  ios_backgroundColor={colors.muted}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconAlertTriangle size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtros Rápidos
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => handleToggle('showOverdueOnly', !localFilters.showOverdueOnly)}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas Atrasados</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas empréstimos vencidos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={!!localFilters.showOverdueOnly}
              onValueChange={(value) => handleToggle('showOverdueOnly', value)}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.showOverdueOnly ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Item Type Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconPackage size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Item
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Filtrar por categoria/tipo
            </ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Digite o tipo do item..."
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.itemType || ""}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                itemType: value || undefined
              }))}
            />
          </View>
        </View>

        {/* Date Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarEvent size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                Data Início
              </ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.mutedForeground}
                value={localFilters.dateRange?.start ? new Date(localFilters.dateRange.start).toLocaleDateString('pt-BR') : ""}
                onChangeText={(value) => {
                  // Basic date parsing - in production you'd want proper validation
                  const parts = value.split('/');
                  if (parts.length === 3) {
                    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    if (!isNaN(date.getTime())) {
                      setLocalFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          start: date
                        }
                      }));
                    }
                  }
                }}
              />
            </View>

            <View style={styles.dateInput}>
              <ThemedText style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                Data Fim
              </ThemedText>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.mutedForeground}
                value={localFilters.dateRange?.end ? new Date(localFilters.dateRange.end).toLocaleDateString('pt-BR') : ""}
                onChangeText={(value) => {
                  // Basic date parsing - in production you'd want proper validation
                  const parts = value.split('/');
                  if (parts.length === 3) {
                    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    if (!isNaN(date.getTime())) {
                      setLocalFilters(prev => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          end: date
                        }
                      }));
                    }
                  }
                }}
              />
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
  dateRangeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateInput: {
    flex: 1,
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
