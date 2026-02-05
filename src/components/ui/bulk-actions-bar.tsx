import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { IconX,} from '@tabler/icons-react-native';
import { ThemedText } from './themed-text';
import { Button } from './button';
import { useTheme } from '@/lib/theme';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  onPress: (selectedIds: Set<string>) => void | Promise<void>;
  disabled?: boolean;
  requiresConfirmation?: boolean;
}

interface BulkActionsBarProps {
  selectedIds: Set<string>;
  actions: BulkAction[];
  onClear: () => void;
  isLoading?: boolean;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedIds,
  actions,
  onClear,
  isLoading = false,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.card,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      padding: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    selectedText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    actionButton: {
      minWidth: 100,
    },
  });

  if (selectedIds.size === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.selectedText}>
          {selectedIds.size} {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
        </ThemedText>
        <Button
          variant="ghost"
          size="sm"
          onPress={onClear}
          disabled={isLoading}
        >
          <IconX size={16} color={theme.colors.text} />
          <ThemedText style={{ marginLeft: theme.spacing.xs }}>Limpar</ThemedText>
        </Button>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.actionsRow}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant || 'default'}
                size="sm"
                onPress={() => action.onPress(selectedIds)}
                disabled={action.disabled || isLoading}
                style={styles.actionButton}
              >
                {Icon && <Icon size={16} color={theme.colors.text} />}
                <ThemedText style={{ marginLeft: Icon ? theme.spacing.xs : 0 }}>
                  {action.label}
                </ThemedText>
              </Button>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Hook to manage bulk selection state
 */
export function useBulkSelection(initialSelected: Set<string> = new Set()) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(initialSelected);

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = React.useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = React.useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.size,
  };
}
