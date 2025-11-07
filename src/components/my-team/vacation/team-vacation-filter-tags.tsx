import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import { useTheme } from '@/lib/theme';
import { ThemedText } from '@/components/ui/themed-text';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '../../../utils';
import { VACATION_STATUS_LABELS, VACATION_TYPE_LABELS } from '../../../constants';

interface TeamVacationFilterTagsProps {
  filters: {
    statuses?: string[];
    types?: string[];
    startDateFrom?: Date;
    endDateTo?: Date;
    showCurrentOnly?: boolean;
    showConflictsOnly?: boolean;
  };
  searchText: string;
  onFilterChange: (filters: any) => void;
  onSearchChange: (text: string) => void;
  onClearAll: () => void;
}

export function TeamVacationFilterTags({
  filters,
  searchText,
  onFilterChange,
  onSearchChange,
  onClearAll,
}: TeamVacationFilterTagsProps) {
  const { colors } = useTheme();

  const tags = useMemo(() => {
    const result: Array<{ key: string; label: string; onRemove: () => void }> = [];

    // Search tag
    if (searchText) {
      result.push({
        key: 'search',
        label: `Busca: "${searchText}"`,
        onRemove: () => onSearchChange(''),
      });
    }

    // Status tags
    if (filters.statuses?.length) {
      filters.statuses.forEach((status) => {
        result.push({
          key: `status-${status}`,
          label: `Status: ${VACATION_STATUS_LABELS[status as keyof typeof VACATION_STATUS_LABELS] || status}`,
          onRemove: () => {
            const newStatuses = filters.statuses?.filter((s) => s !== status);
            onFilterChange({
              ...filters,
              statuses: newStatuses?.length ? newStatuses : undefined,
            });
          },
        });
      });
    }

    // Type tags
    if (filters.types?.length) {
      filters.types.forEach((type) => {
        result.push({
          key: `type-${type}`,
          label: `Tipo: ${VACATION_TYPE_LABELS[type as keyof typeof VACATION_TYPE_LABELS] || type}`,
          onRemove: () => {
            const newTypes = filters.types?.filter((t) => t !== type);
            onFilterChange({
              ...filters,
              types: newTypes?.length ? newTypes : undefined,
            });
          },
        });
      });
    }

    // Date from tag
    if (filters.startDateFrom) {
      result.push({
        key: 'startDateFrom',
        label: `Início: ${formatDate(filters.startDateFrom)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            startDateFrom: undefined,
          });
        },
      });
    }

    // Date to tag
    if (filters.endDateTo) {
      result.push({
        key: 'endDateTo',
        label: `Fim: ${formatDate(filters.endDateTo)}`,
        onRemove: () => {
          onFilterChange({
            ...filters,
            endDateTo: undefined,
          });
        },
      });
    }

    // Show current only tag
    if (filters.showCurrentOnly) {
      result.push({
        key: 'showCurrentOnly',
        label: 'Apenas em andamento',
        onRemove: () => {
          onFilterChange({
            ...filters,
            showCurrentOnly: undefined,
          });
        },
      });
    }

    // Show conflicts only tag
    if (filters.showConflictsOnly) {
      result.push({
        key: 'showConflictsOnly',
        label: 'Apenas conflitos',
        onRemove: () => {
          onFilterChange({
            ...filters,
            showConflictsOnly: undefined,
          });
        },
      });
    }

    return result;
  }, [filters, searchText, onFilterChange, onSearchChange]);

  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => (
          <Badge
            key={tag.key}
            variant="secondary"
            style={[styles.tag, { backgroundColor: colors.muted }]}
          >
            <ThemedText style={styles.tagText}>{tag.label}</ThemedText>
            <TouchableOpacity
              onPress={tag.onRemove}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.removeButton}
            >
              <IconX size={14} color={colors.foreground} />
            </TouchableOpacity>
          </Badge>
        ))}

        {tags.length > 1 && (
          <TouchableOpacity
            onPress={onClearAll}
            style={[styles.clearAllButton, { backgroundColor: colors.destructive }]}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.clearAllText, { color: colors.destructiveForeground }]}>
              Limpar todos
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
    paddingLeft: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 4,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
