import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import {
  ResponsibleRole,
  ResponsibleRowData,
} from '@/types/responsible';
import { ResponsibleRow } from './ResponsibleRow';

interface ResponsibleManagerProps {
  companyId?: string | null;
  value: ResponsibleRowData[];
  onChange: (rows: ResponsibleRowData[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  minRows?: number;
  maxRows?: number;
  label?: string;
  error?: string;
  helperText?: string;
  allowedRoles?: ResponsibleRole[];
  required?: boolean;
}

// Generate a unique temporary ID for new rows (matches web format: temp-{timestamp}-{random})
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const ResponsibleManager: React.FC<ResponsibleManagerProps> = ({
  companyId,
  value = [],
  onChange,
  disabled = false,
  readOnly = false,
  minRows = 0,
  maxRows = 10,
  label = 'Responsáveis',
  error,
  helperText,
  allowedRoles,
  required = false,
}) => {
  const { colors } = useTheme();

  // Ensure at least minRows are always present (matches web behavior)
  useEffect(() => {
    if (value.length < minRows) {
      const emptyRows: ResponsibleRowData[] = Array.from(
        { length: minRows - value.length },
        (_, i) => ({
          id: generateTempId(),
          name: '',
          phone: '',
          email: null,
          role: allowedRoles?.[0] || ResponsibleRole.COMMERCIAL,
          isActive: true,
          isNew: true,
          isEditing: false, // Start with combobox visible, not edit mode (matches web)
          isSaving: false,
          error: null,
          companyId: null, // User explicitly selects via CustomerCombobox
        })
      );
      onChange([...value, ...emptyRows]);
    }
  }, [value.length, minRows, onChange, allowedRoles, companyId]);

  // Add a new responsible row
  const handleAddRow = useCallback(() => {
    if (value.length >= maxRows) {
      Alert.alert('Limite atingido', `Máximo de ${maxRows} responsáveis permitido`);
      return;
    }

    const newRow: ResponsibleRowData = {
      id: generateTempId(),
      name: '',
      phone: '',
      email: null,
      role: allowedRoles?.[0] || ResponsibleRole.COMMERCIAL,
      isActive: true,
      isNew: true,
      isEditing: false, // Start with combobox visible, not edit mode (matches web)
      isSaving: false,
      error: null,
      companyId: null, // User explicitly selects via CustomerCombobox
    };

    onChange([...value, newRow]);
  }, [value, maxRows, allowedRoles, onChange, companyId]);

  // Update a specific row (using index like web version)
  const handleUpdateRow = useCallback(
    (index: number, updates: Partial<ResponsibleRowData>) => {
      const updatedRows = value.map((row, i) => {
        if (i === index) {
          return { ...row, ...updates, error: null };
        }
        return row;
      });
      onChange(updatedRows);
    },
    [value, onChange]
  );

  // Remove a row (using index like web version)
  const handleRemoveRow = useCallback(
    (index: number) => {
      if (value.length <= minRows) {
        Alert.alert('Mínimo de responsáveis', `Você deve ter pelo menos ${minRows} responsável(is)`);
        return;
      }
      const updatedRows = value.filter((_, i) => i !== index);
      onChange(updatedRows);
    },
    [value, minRows, onChange]
  );

  const canAddMore = value.length < maxRows && !disabled && !readOnly;

  return (
    <View style={styles.container}>
      {/* Responsible rows */}
      {value.length > 0 ? (
        <View style={styles.rowsContainer}>
          {value.map((row, index) => (
            <ResponsibleRow
              key={row.id}
              row={row}
              index={index}
              companyId={companyId || ''}
              onUpdate={(updates) => handleUpdateRow(index, updates)}
              onRemove={() => handleRemoveRow(index)}
              disabled={disabled}
              readOnly={readOnly}
              isFirstRow={index === 0}
              isLastRow={index === value.length - 1}
            />
          ))}
        </View>
      ) : null}

      {/* Add button - matches service order style */}
      {canAddMore && (
        <Button
          variant="outline"
          size="sm"
          onPress={handleAddRow}
          disabled={disabled}
          style={styles.addButton}
        >
          <IconPlus size={16} color={colors.foreground} />
          <ThemedText style={{ marginLeft: 4, fontSize: 14, color: colors.foreground }}>
            Adicionar
          </ThemedText>
        </Button>
      )}

      {/* Error display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '15' }]}>
          <IconAlertCircle size={16} color={colors.destructive} />
          <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
            {error}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  loadingIndicator: {
    marginLeft: spacing.sm,
  },
  rowsContainer: {
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  emptyState: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
});
