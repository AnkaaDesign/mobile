import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconUser, IconCalendarPlus, IconFileText } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { DateRangeFilter } from '@/components/common/filters';
import { useUsers } from "@/hooks";
import {
  CHANGE_LOG_ACTION,
  CHANGE_LOG_ACTION_LABELS,
  CHANGE_LOG_ENTITY_TYPE,
  CHANGE_LOG_ENTITY_TYPE_LABELS,
} from "@/constants";
import type { ChangeLogGetManyFormData } from '../../../../schemas';

interface ChangeLogFilterDrawerContentProps {
  filters: Partial<ChangeLogGetManyFormData>;
  onFiltersChange: (filters: Partial<ChangeLogGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

interface FilterState {
  actions?: CHANGE_LOG_ACTION[];
  entityTypes?: CHANGE_LOG_ENTITY_TYPE[];
  userIds?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export function ChangeLogFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: ChangeLogFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const handleClose = onClose || (() => {});

  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data || [];

  const [localFilters, setLocalFilters] = useState<FilterState>(() => ({
    actions: filters.actions || [],
    entityTypes: filters.entityTypes || [],
    userIds: filters.userIds || [],
    createdAfter: filters.createdAt?.gte,
    createdBefore: filters.createdAt?.lte,
  }));

  const handleApply = useCallback(() => {
    const newFilters: Partial<ChangeLogGetManyFormData> = {};

    if (localFilters.actions && localFilters.actions.length > 0) {
      newFilters.actions = localFilters.actions;
    }

    if (localFilters.entityTypes && localFilters.entityTypes.length > 0) {
      newFilters.entityTypes = localFilters.entityTypes;
    }

    if (localFilters.userIds && localFilters.userIds.length > 0) {
      newFilters.userIds = localFilters.userIds;
    }

    if (localFilters.createdAfter || localFilters.createdBefore) {
      newFilters.createdAt = {};
      if (localFilters.createdAfter) {
        newFilters.createdAt.gte = localFilters.createdAfter;
      }
      if (localFilters.createdBefore) {
        newFilters.createdAt.lte = localFilters.createdBefore;
      }
    }

    onFiltersChange(newFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    onClear();
  }, [onClear]);

  const handleActionChange = (action: CHANGE_LOG_ACTION, checked: boolean) => {
    const actions = localFilters.actions || [];
    if (checked) {
      setLocalFilters((prev) => ({ ...prev, actions: [...actions, action] }));
    } else {
      setLocalFilters((prev) => ({ ...prev, actions: actions.filter((a) => a !== action) }));
    }
  };

  const handleEntityTypeChange = (entityType: CHANGE_LOG_ENTITY_TYPE, checked: boolean) => {
    const entityTypes = localFilters.entityTypes || [];
    if (checked) {
      setLocalFilters((prev) => ({ ...prev, entityTypes: [...entityTypes, entityType] }));
    } else {
      setLocalFilters((prev) => ({ ...prev, entityTypes: entityTypes.filter((et) => et !== entityType) }));
    }
  };

  const userOptions = useMemo(
    () => users.map((user) => ({ value: user.id, label: user.name })),
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
          <ThemedText style={styles.title}>Filtros de Histórico</ThemedText>
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
        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileText size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ação
            </ThemedText>
          </View>

          <View style={styles.checkboxContainer}>
            {Object.entries(CHANGE_LOG_ACTION_LABELS).map(([key, label]) => (
              <View key={key} style={styles.checkboxRow}>
                <Checkbox
                  checked={localFilters.actions?.includes(key as CHANGE_LOG_ACTION) || false}
                  onCheckedChange={(checked) => handleActionChange(key as CHANGE_LOG_ACTION, checked as boolean)}
                  label={label}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Entity Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFileText size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Entidade
            </ThemedText>
          </View>

          <ScrollView
            style={styles.scrollableSection}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.checkboxContainer}>
              {Object.entries(CHANGE_LOG_ENTITY_TYPE_LABELS).map(([key, label]) => (
                <View key={key} style={styles.checkboxRow}>
                  <Checkbox
                    checked={localFilters.entityTypes?.includes(key as CHANGE_LOG_ENTITY_TYPE) || false}
                    onCheckedChange={(checked) => handleEntityTypeChange(key as CHANGE_LOG_ENTITY_TYPE, checked as boolean)}
                    label={label}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Users */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconUser size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Usuário
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>
              Selecionar Usuário
            </ThemedText>
            <Combobox
              options={userOptions}
              selectedValues={localFilters.userIds || []}
              onValueChange={(values) => setLocalFilters((prev) => ({ ...prev, userIds: values }))}
              placeholder="Todos os usuários"
              searchPlaceholder="Buscar usuários..."
              emptyText="Nenhum usuário encontrado"
            />
          </View>
        </View>

        {/* Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Período
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Criação"
            value={{
              from: localFilters.createdAfter,
              to: localFilters.createdBefore
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                createdAfter: range?.from,
                createdBefore: range?.to
              }))
            }
          />
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
  checkboxContainer: {
    gap: 8,
  },
  checkboxRow: {
    marginBottom: 4,
  },
  scrollableSection: {
    maxHeight: 300,
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
