import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { IconFilter, IconX, IconFile, IconCalendarPlus, IconRuler } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { useUtilityDrawer } from '@/contexts/utility-drawer-context';
import { DateRangeFilter } from '@/components/common/filters';
import type { FileGetManyFormData } from '@/schemas';

interface FileFilterDrawerContentProps {
  filters: Partial<FileGetManyFormData>;
  onFiltersChange: (filters: Partial<FileGetManyFormData>) => void;
  onClear: () => void;
  activeFiltersCount: number;
}

interface FilterRange {
  min?: number;
  max?: number;
}

interface FilterState {
  mimeTypes?: string[];
  sizeRange?: FilterRange;
  createdDateRange?: { start?: Date; end?: Date };
  updatedDateRange?: { start?: Date; end?: Date };
}

// Common MIME type presets
const COMMON_MIME_TYPES = [
  { value: "image/*", label: "Imagens" },
  { value: "application/pdf", label: "PDF" },
  { value: "application/vnd.ms-excel", label: "Excel" },
  { value: "application/msword", label: "Word" },
  { value: "video/*", label: "Vídeos" },
  { value: "audio/*", label: "Áudio" },
];

export function FileFilterDrawerContent({
  filters,
  onFiltersChange,
  onClear,
  activeFiltersCount,
}: FileFilterDrawerContentProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { closeFilterDrawer } = useUtilityDrawer();

  const [localFilters, setLocalFilters] = useState<FilterState>(() => filters || {});
  const [selectedMimeTypes, setSelectedMimeTypes] = useState<string[]>([]);

  useEffect(() => {
    setLocalFilters(filters || {});
    const currentMimeTypes = filters.where?.mimetype?.in || [];
    setSelectedMimeTypes(currentMimeTypes);
  }, [filters]);

  const toggleMimeType = useCallback((mimeType: string) => {
    setSelectedMimeTypes((prev) => {
      if (prev.includes(mimeType)) {
        return prev.filter((m) => m !== mimeType);
      }
      return [...prev, mimeType];
    });
  }, []);

  const handleApply = useCallback(() => {
    const appliedFilters: Partial<FileGetManyFormData> = {
      ...filters,
    };

    // Build where clause for MIME types
    if (selectedMimeTypes.length > 0) {
      appliedFilters.where = {
        ...appliedFilters.where,
        mimetype: { in: selectedMimeTypes },
      };
    } else {
      if (appliedFilters.where?.mimetype) {
        delete appliedFilters.where.mimetype;
      }
    }

    // Add size filters
    if (localFilters.sizeRange?.min !== undefined || localFilters.sizeRange?.max !== undefined) {
      appliedFilters.where = {
        ...appliedFilters.where,
        size: {
          ...(localFilters.sizeRange.min !== undefined ? { gte: localFilters.sizeRange.min * 1024 } : {}),
          ...(localFilters.sizeRange.max !== undefined ? { lte: localFilters.sizeRange.max * 1024 } : {}),
        },
      };
    }

    // Add date filters
    if (localFilters.createdDateRange?.start || localFilters.createdDateRange?.end) {
      appliedFilters.createdAt = {
        ...(localFilters.createdDateRange.start ? { gte: localFilters.createdDateRange.start } : {}),
        ...(localFilters.createdDateRange.end ? { lte: localFilters.createdDateRange.end } : {}),
      };
    }

    if (localFilters.updatedDateRange?.start || localFilters.updatedDateRange?.end) {
      appliedFilters.updatedAt = {
        ...(localFilters.updatedDateRange.start ? { gte: localFilters.updatedDateRange.start } : {}),
        ...(localFilters.updatedDateRange.end ? { lte: localFilters.updatedDateRange.end } : {}),
      };
    }

    onFiltersChange(appliedFilters);
    closeFilterDrawer();
  }, [localFilters, selectedMimeTypes, filters, onFiltersChange, closeFilterDrawer]);

  const handleClear = useCallback(() => {
    setLocalFilters({});
    setSelectedMimeTypes([]);
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
          <ThemedText style={styles.title}>Filtros de Arquivos</ThemedText>
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
        {/* MIME Type Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconFile size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tipo de Arquivo
            </ThemedText>
          </View>

          <View style={styles.chipContainer}>
            {COMMON_MIME_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => toggleMimeType(type.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.chip,
                  {
                    backgroundColor: selectedMimeTypes.includes(type.value) ? colors.primary : colors.muted,
                    borderColor: selectedMimeTypes.includes(type.value) ? colors.primary : colors.border,
                  }
                ]}>
                  <ThemedText style={[
                    styles.chipText,
                    { color: selectedMimeTypes.includes(type.value) ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {type.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Size Range Filter */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconRuler size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tamanho (KB)
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
                value={localFilters.sizeRange?.min?.toString() || ""}
                onChangeText={(value) => {
                  const min = value ? parseFloat(value) : undefined;
                  if (min !== undefined && isNaN(min)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    sizeRange: {
                      ...prev.sizeRange,
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
                placeholder="∞"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.sizeRange?.max?.toString() || ""}
                onChangeText={(value) => {
                  const max = value ? parseFloat(value) : undefined;
                  if (max !== undefined && isNaN(max)) return;
                  setLocalFilters(prev => ({
                    ...prev,
                    sizeRange: {
                      ...prev.sizeRange,
                      max
                    }
                  }));
                }}
              />
            </View>
          </View>
        </View>

        {/* Created Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Criação
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Criação"
            value={{
              from: localFilters.createdDateRange?.start,
              to: localFilters.createdDateRange?.end
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                createdDateRange: range ? {
                  start: range.from,
                  end: range.to
                } : undefined
              }))
            }
          />
        </View>

        {/* Updated Date Range */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCalendarPlus size={18} color={colors.mutedForeground} />
            <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
              Data de Atualização
            </ThemedText>
          </View>

          <DateRangeFilter
            label="Período de Atualização"
            value={{
              from: localFilters.updatedDateRange?.start,
              to: localFilters.updatedDateRange?.end
            }}
            onChange={(range) =>
              setLocalFilters((prev) => ({
                ...prev,
                updatedDateRange: range ? {
                  start: range.from,
                  end: range.to
                } : undefined
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
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
