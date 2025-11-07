import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch as RNSwitch } from 'react-native';
import { IconFilter, IconX, IconBriefcase, IconMapPin, IconCalendarPlus, IconTags } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '@/constants';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';

interface CustomerFilterDrawerContentProps {
  filters: {
    states?: string[];
    city?: string;
    tags?: string[];
    hasCNPJ?: boolean;
    hasCPF?: boolean;
    hasTasks?: boolean;
    taskCount?: { min?: number; max?: number };
    createdAt?: { gte?: Date; lte?: Date };
  };
  onFiltersChange: (filters: any) => void;
  onClear: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export function CustomerFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
  onClose,
}: CustomerFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const handleClose = onClose || closeFilterDrawer;
  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});
  const [customTags, setCustomTags] = useState("");

  const handleToggle = useCallback((key: string, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (customTags.trim()) {
      const newTags = customTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      setLocalFilters(prev => ({
        ...prev,
        tags: [...(prev.tags || []), ...newTags]
      }));
      setCustomTags("");
    }
  }, [customTags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    handleClose();
  }, [localFilters, onFiltersChange, handleClose]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    setCustomTags("");
    onClear();
  }, [onClear]);

  // Filter options list
  const filterOptions = useMemo(() => {
    const options = [
      {
        key: 'hasTasks',
        label: 'Possui Tarefas',
        icon: IconBriefcase,
        type: 'boolean',
        value: localFilters.hasTasks,
        description: 'Clientes com tarefas associadas'
      },
      {
        key: 'hasCNPJ',
        label: 'Possui CNPJ',
        type: 'boolean',
        value: localFilters.hasCNPJ,
        description: 'Clientes com CNPJ cadastrado'
      },
      {
        key: 'hasCPF',
        label: 'Possui CPF',
        type: 'boolean',
        value: localFilters.hasCPF,
        description: 'Clientes com CPF cadastrado'
      }
    ];

    return options;
  }, [localFilters]);

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
          <ThemedText style={styles.title}>Filtros de Clientes</ThemedText>
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
        {/* Boolean Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Filtros Gerais
            </ThemedText>
          </View>

          {filterOptions.map((option) => (
            <View key={option.key} style={[styles.filterItem, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.filterTouchable}
                onPress={() => handleToggle(option.key, !option.value)}
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
                value={!!option.value}
                onValueChange={(value) => handleToggle(option.key, value)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={option.value ? colors.primaryForeground : "#f4f3f4"}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </View>

        {/* Location Filters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconMapPin size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Localização
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Estados</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Ex: SP, RJ, MG"
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.states?.join(", ") || ""}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                states: value ? value.split(",").map(s => s.trim()).filter(Boolean) : undefined
              }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: colors.foreground }]}>Cidade</ThemedText>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground
              }]}
              placeholder="Digite o nome da cidade"
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.city || ""}
              onChangeText={(value) => setLocalFilters(prev => ({
                ...prev,
                city: value || undefined
              }))}
            />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconTags size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tags
            </ThemedText>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.tagInputWrapper}>
              <TextInput
                style={[styles.textInput, styles.tagInput, {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground
                }]}
                placeholder="Digite tags separadas por vírgula..."
                placeholderTextColor={colors.mutedForeground}
                value={customTags}
                onChangeText={setCustomTags}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleAddTag}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.addButtonText, { color: colors.primaryForeground }]}>
                  Adicionar
                </ThemedText>
              </TouchableOpacity>
            </View>

            {localFilters.tags && localFilters.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {localFilters.tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tag, { backgroundColor: colors.muted }]}
                    onPress={() => handleRemoveTag(tag)}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={[styles.tagText, { color: colors.foreground }]}>{tag}</ThemedText>
                    <IconX size={14} color={colors.foreground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Task Count Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconBriefcase size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Quantidade de Tarefas
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
                value={localFilters.taskCount?.min?.toString() || ""}
                onChangeText={(value) => {
                  const min = value ? parseInt(value, 10) : undefined;
                  if (min !== undefined && isNaN(min)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    taskCount: {
                      ...prev.taskCount,
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
                value={localFilters.taskCount?.max?.toString() || ""}
                onChangeText={(value) => {
                  const max = value ? parseInt(value, 10) : undefined;
                  if (max !== undefined && isNaN(max)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    taskCount: {
                      ...prev.taskCount,
                      max
                    }
                  }));
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
  tagInputWrapper: {
    flexDirection: "row",
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  rangeInputs: {
    flexDirection: "row",
    gap: 12,
  },
  rangeInput: {
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