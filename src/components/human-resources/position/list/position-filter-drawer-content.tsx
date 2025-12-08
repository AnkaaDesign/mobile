import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconBriefcase, IconCurrencyDollar } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useSectors } from '../../../../hooks';
import type { PositionGetManyFormData } from '../../../../schemas';

interface PositionFilterDrawerContentProps {
  filters: Partial<PositionGetManyFormData>;
  onFiltersChange: (filters: Partial<PositionGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  bonifiable?: boolean;
  hasUsers?: boolean;
  sectorIds?: string[];
  remunerationRange?: FilterRange;
}

export function PositionFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PositionFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: sectorsData } = useSectors({ limit: 100, orderBy: { name: "asc" } });
  const sectors = sectorsData?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    bonifiable: filters.bonifiable,
    hasUsers: filters.hasUsers,
    sectorIds: filters.sectorIds || [],
    remunerationRange: filters.remunerationRange,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<PositionGetManyFormData> = {};

    if (localFilters.bonifiable !== undefined) {
      newFilters.bonifiable = localFilters.bonifiable;
    }

    if (localFilters.hasUsers !== undefined) {
      newFilters.hasUsers = localFilters.hasUsers;
    }

    if (localFilters.sectorIds && localFilters.sectorIds.length > 0) {
      newFilters.sectorIds = localFilters.sectorIds;
    }

    if (localFilters.remunerationRange?.min !== undefined || localFilters.remunerationRange?.max !== undefined) {
      newFilters.remunerationRange = localFilters.remunerationRange;
    }

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const sectorOptions = useMemo(
    () => sectors.map((sector) => ({ label: sector.name, value: sector.id })),
    [sectors]
  );

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
          <ThemedText style={styles.title}>Filtros de Cargos</ThemedText>
          {activeFiltersCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
              <ThemedText style={[styles.countText, { color: colors.destructiveForeground }]}>
                {activeFiltersCount}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose || (() => {})} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Characteristics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Características
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, bonifiable: !prev.bonifiable }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas bonificáveis</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas cargos que recebem bonificação
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.bonifiable || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, bonifiable: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.bonifiable ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasUsers: !prev.hasUsers }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Apenas com usuários</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas cargos com usuários atribuídos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasUsers || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasUsers: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasUsers ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>
        </View>

        {/* Sectors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Setores
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Setores
            </ThemedText>
            <Combobox
              options={sectorOptions}
              value={localFilters.sectorIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, sectorIds: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder={sectors.length === 0 ? "Carregando setores..." : "Todos os setores"}
              searchPlaceholder="Buscar setores..."
              emptyText="Nenhum setor encontrado"
              disabled={sectors.length === 0}
            />
          </View>
        </View>

        {/* Remuneration Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCurrencyDollar size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Remuneração
            </ThemedText>
          </View>

          <View style={styles.rangeContainer}>
            <View style={styles.rangeInputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Valor Mínimo (R$)
              </ThemedText>
              <Input
                placeholder="Mínimo"
                value={localFilters.remunerationRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    remunerationRange: {
                      ...prev.remunerationRange,
                      min: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.rangeInputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
                Valor Máximo (R$)
              </ThemedText>
              <Input
                placeholder="Máximo"
                value={localFilters.remunerationRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const numValue = value ? parseFloat(value) : undefined;
                  setLocalFilters((prev) => ({
                    ...prev,
                    remunerationRange: {
                      ...prev.remunerationRange,
                      max: numValue,
                    },
                  }));
                }}
                keyboardType="numeric"
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
  rangeContainer: {
    gap: 12,
  },
  rangeInputGroup: {
    marginBottom: 10,
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
