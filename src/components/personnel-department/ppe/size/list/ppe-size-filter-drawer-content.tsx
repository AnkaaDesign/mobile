import { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconUsers, IconShirt } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { useUsers } from '../../../../../hooks';
import type { PpeSizeGetManyFormData } from '../../../../../schemas';

interface PpeSizeFilterDrawerContentProps {
  filters: Partial<PpeSizeGetManyFormData>;
  onFiltersChange: (filters: Partial<PpeSizeGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  userIds?: string[];
  hasAllSizes?: boolean;
  missingShirts?: boolean;
  missingPants?: boolean;
  missingBoots?: boolean;
}

export function PpeSizeFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: PpeSizeFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: usersData } = useUsers({
    limit: 100,
    orderBy: { name: "asc" },
    where: { status: "ACTIVE" }
  });
  const users = usersData?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    userIds: filters.userIds || [],
    hasAllSizes: filters.hasAllSizes,
    missingShirts: filters.missingShirts,
    missingPants: filters.missingPants,
    missingBoots: filters.missingBoots,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<PpeSizeGetManyFormData> = {};

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.hasAllSizes !== undefined) {
      newFilters.hasAllSizes = localFilters.hasAllSizes;
    }

    if (localFilters.missingShirts !== undefined) {
      newFilters.missingShirts = localFilters.missingShirts;
    }

    if (localFilters.missingPants !== undefined) {
      newFilters.missingPants = localFilters.missingPants;
    }

    if (localFilters.missingBoots !== undefined) {
      newFilters.missingBoots = localFilters.missingBoots;
    }

    onFiltersChange(newFilters);
    const handleClose = onClose || (() => {}); handleClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const userOptions = useMemo(
    () => users.map((user) => ({
      label: `${user.name}${user.cpf ? ` - ${user.cpf}` : ''}`,
      value: user.id
    })),
    [users]
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
          <ThemedText style={styles.title}>Filtros de Tamanhos de EPI</ThemedText>
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
        {/* Employees */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUsers size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Funcionários
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Funcionários
            </ThemedText>
            <Combobox
              options={userOptions}
              value={localFilters.userIds || []}
              mode="multiple"
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: Array.isArray(values) ? values : values ? [values] : [] }))}
              placeholder={users.length === 0 ? "Carregando funcionários..." : "Todos os funcionários"}
              searchPlaceholder="Buscar funcionários..."
              emptyText="Nenhum funcionário encontrado"
              disabled={users.length === 0}
            />
          </View>
        </View>

        {/* Completeness Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconShirt size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Status de Completude
            </ThemedText>
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, hasAllSizes: !prev.hasAllSizes }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Todos os tamanhos cadastrados</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar apenas funcionários com todos os tamanhos
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.hasAllSizes || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, hasAllSizes: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.hasAllSizes ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, missingShirts: !prev.missingShirts }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Faltando tamanho de camisa</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar funcionários sem tamanho de camisa
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.missingShirts || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, missingShirts: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.missingShirts ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, missingPants: !prev.missingPants }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Faltando tamanho de calça</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar funcionários sem tamanho de calça
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.missingPants || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, missingPants: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.missingPants ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
          </View>

          <View style={[styles.filterItem, { borderBottomWidth: 0 }]}>
            <TouchableOpacity
              style={styles.filterTouchable}
              onPress={() => setLocalFilters((prev) => ({ ...prev, missingBoots: !prev.missingBoots }))}
              activeOpacity={0.7}
            >
              <View>
                <ThemedText style={styles.filterLabel}>Faltando tamanho de calçado</ThemedText>
                <ThemedText style={[styles.filterDescription, { color: colors.mutedForeground }]}>
                  Mostrar funcionários sem tamanho de calçado
                </ThemedText>
              </View>
            </TouchableOpacity>
            <RNSwitch
              value={localFilters.missingBoots || false}
              onValueChange={(value) => setLocalFilters((prev) => ({ ...prev, missingBoots: value || undefined }))}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={localFilters.missingBoots ? colors.primaryForeground : "#f4f3f4"}
              ios_backgroundColor={colors.muted}
            />
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
