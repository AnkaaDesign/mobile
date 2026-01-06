import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFilter, IconX, IconCheck } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import {
  BooleanFilter,
  StringFilter,
  NumericRangeFilter,
} from '@/components/common/filters';
import { spacing } from '@/constants/design-system';
import { Input } from '@/components/ui/input';

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
  const handleClose = onClose || (() => {});

  // Initialize localFilters with filters value immediately
  const [localFilters, setLocalFilters] = useState(() => filters || {});
  const [customTags, setCustomTags] = useState("");

  const updateFilter = useCallback((key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
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
          <Text style={styles.title}>Filtros de Clientes</Text>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              <Text style={{ fontSize: 12, fontWeight: '600' }}>
                {activeFiltersCount}
              </Text>
            </Badge>
          )}
        </View>
        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconX size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Filter List - Flat structure with icons */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, {
          paddingBottom: Math.max(insets.bottom, 16) + 90,
          gap: spacing.lg
        }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Boolean: Has Tasks */}
        <BooleanFilter
          label="Possui Tarefas"
          icon={getFilterIcon('hasTasks')}
          description="Clientes com tarefas associadas"
          value={!!localFilters.hasTasks}
          onChange={(v) => updateFilter('hasTasks', v || undefined)}
        />

        <Separator />

        {/* Boolean: Has CNPJ */}
        <BooleanFilter
          label="Possui CNPJ"
          icon={getFilterIcon('hasCNPJ')}
          description="Clientes com CNPJ cadastrado"
          value={!!localFilters.hasCNPJ}
          onChange={(v) => updateFilter('hasCNPJ', v || undefined)}
        />

        <Separator />

        {/* Boolean: Has CPF */}
        <BooleanFilter
          label="Possui CPF"
          icon={getFilterIcon('hasCPF')}
          description="Clientes com CPF cadastrado"
          value={!!localFilters.hasCPF}
          onChange={(v) => updateFilter('hasCPF', v || undefined)}
        />

        <Separator />

        {/* String: States */}
        <StringFilter
          label="Estados"
          icon={getFilterIcon('states')}
          placeholder="Ex: SP, RJ, MG"
          value={localFilters.states?.join(", ") || ""}
          onChange={(value) => {
            if (!value) {
              updateFilter('states', undefined);
              return;
            }
            // Type guard: extract string value from StringFilterValue or use string directly
            const stringValue = typeof value === 'string' ? value : value.value;
            updateFilter('states', stringValue.split(",").map(s => s.trim()).filter(Boolean));
          }}
        />

        <Separator />

        {/* String: City */}
        <StringFilter
          label="Cidade"
          icon={getFilterIcon('city')}
          placeholder="Digite o nome da cidade"
          value={localFilters.city || ""}
          onChange={(value) => updateFilter('city', value || undefined)}
        />

        <Separator />

        {/* Tags - Custom implementation */}
        <View style={styles.filterSection}>
          <View style={styles.labelRow}>
            {getFilterIcon('tags') && React.createElement(getFilterIcon('tags'), { size: 18, color: colors.foreground })}
            <Text style={styles.filterLabel}>Tags</Text>
          </View>

          <View style={styles.tagInputWrapper}>
            <Input
              placeholder="Digite tags separadas por vírgula..."
              value={customTags}
              onChangeText={(text) => setCustomTags(text || '')}
              onSubmitEditing={handleAddTag}
              style={styles.tagInput}
            />
            <Button
              variant="default"
              size="sm"
              onPress={handleAddTag}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '600' }}>
                Adicionar
              </Text>
            </Button>
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
                  <Text style={[styles.tagText, { color: colors.foreground }]}>{tag}</Text>
                  <IconX size={14} color={colors.foreground} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Separator />

        {/* Numeric Range: Task Count */}
        <NumericRangeFilter
          label="Quantidade de Tarefas"
          icon={getFilterIcon('taskCount')}
          value={localFilters.taskCount}
          onChange={(v) => updateFilter('taskCount', v)}
          minPlaceholder="Mínimo"
          maxPlaceholder="Máximo"
        />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 16)
      }]}>
        <Button
          variant="outline"
          onPress={handleClear}
          style={styles.footerButton}
        >
          <IconX size={18} color={colors.foreground} />
          <Text style={{ marginLeft: spacing.xs }}>Limpar</Text>
        </Button>
        <Button
          variant="default"
          onPress={handleApply}
          style={styles.footerButton}
        >
          <IconCheck size={18} color={colors.background} />
          <Text style={{ marginLeft: spacing.xs, color: colors.background }}>
            Aplicar
          </Text>
        </Button>
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
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  filterSection: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  tagInputWrapper: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tagInput: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});