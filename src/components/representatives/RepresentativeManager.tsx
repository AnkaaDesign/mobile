import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { IconPlus, IconAlertCircle } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { representativeService } from '@/services/representativeService';
import {
  Representative,
  RepresentativeRole,
  RepresentativeRowData,
} from '@/types/representative';
import { RepresentativeRow } from './RepresentativeRow';

interface CustomerOption {
  id: string;
  name: string;
}

interface InvoiceToCustomer {
  id: string;
  fantasyName?: string;
  corporateName?: string;
}

interface RepresentativeManagerProps {
  customerId?: string | null;
  customerName?: string; // Display name for primary customer
  invoiceToId?: string | null; // Billing customer (legacy single)
  invoiceToName?: string; // Display name for billing customer (legacy single)
  invoiceToCustomers?: InvoiceToCustomer[]; // Multiple billing customers from pricing
  value: RepresentativeRowData[];
  onChange: (rows: RepresentativeRowData[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  minRows?: number;
  maxRows?: number;
  label?: string;
  error?: string;
  helperText?: string;
  allowedRoles?: RepresentativeRole[];
  required?: boolean;
}

// Generate a unique temporary ID for new rows (matches web format: temp-{timestamp}-{random})
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const RepresentativeManager: React.FC<RepresentativeManagerProps> = ({
  customerId,
  customerName,
  invoiceToId,
  invoiceToName,
  invoiceToCustomers,
  value = [],
  onChange,
  disabled = false,
  readOnly = false,
  minRows = 0,
  maxRows = 10,
  label = 'Representantes',
  error,
  helperText,
  allowedRoles,
  required = false,
}) => {
  const { colors } = useTheme();
  const [availableRepresentatives, setAvailableRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(false);

  // Build customer options for the dropdown when creating new representatives
  const customerOptions: CustomerOption[] = useMemo(() => {
    const options: CustomerOption[] = [];
    if (customerId && customerName) {
      options.push({ id: customerId, name: customerName });
    }
    // Support multiple invoiceTo customers from pricing
    if (invoiceToCustomers && invoiceToCustomers.length > 0) {
      invoiceToCustomers.forEach(c => {
        if (c.id !== customerId) {
          options.push({ id: c.id, name: c.fantasyName || c.corporateName || 'Cliente' });
        }
      });
    } else if (invoiceToId && invoiceToName && invoiceToId !== customerId) {
      // Legacy single invoiceTo fallback
      options.push({ id: invoiceToId, name: invoiceToName });
    }
    return options;
  }, [customerId, customerName, invoiceToId, invoiceToName, invoiceToCustomers]);

  // Build list of all invoiceTo customer IDs for dependency tracking
  const invoiceToCustomerIds = invoiceToCustomers?.map(c => c.id).join(',') || '';

  // Load available representatives - for customer, invoiceTo customers, or all if no customer selected
  useEffect(() => {
    loadRepresentatives();
  }, [customerId, invoiceToId, invoiceToCustomerIds]);

  const loadRepresentatives = async () => {
    setLoading(true);
    try {
      let reps: Representative[] = [];

      // Collect unique customer IDs to fetch representatives from
      const customerIds = new Set<string>();
      if (customerId) customerIds.add(customerId);
      if (invoiceToCustomers && invoiceToCustomers.length > 0) {
        invoiceToCustomers.forEach(c => customerIds.add(c.id));
      } else if (invoiceToId) {
        customerIds.add(invoiceToId);
      }

      if (customerIds.size > 0) {
        // Fetch representatives for each customer in parallel
        const promises = Array.from(customerIds).map(cId =>
          representativeService.getByCustomer(cId)
        );
        const results = await Promise.all(promises);

        // Merge and deduplicate representatives by ID
        const repsMap = new Map<string, Representative>();
        results.flat().forEach(rep => {
          if (!repsMap.has(rep.id)) {
            repsMap.set(rep.id, rep);
          }
        });
        reps = Array.from(repsMap.values());
      } else {
        // Get all representatives if no customer selected (matches web behavior)
        const response = await representativeService.getAll({ pageSize: 1000 });
        reps = response.data;
      }

      // Filter by active status and allowed roles if specified
      let filteredReps = reps.filter((rep) => rep.isActive);
      if (allowedRoles && allowedRoles.length > 0) {
        filteredReps = filteredReps.filter((rep) => allowedRoles.includes(rep.role));
      }

      setAvailableRepresentatives(filteredReps);
    } catch (err: any) {
      console.error('Error loading representatives:', err);
      setAvailableRepresentatives([]);
    } finally {
      setLoading(false);
    }
  };

  // Ensure at least minRows are always present (matches web behavior)
  useEffect(() => {
    if (value.length < minRows) {
      const emptyRows: RepresentativeRowData[] = Array.from(
        { length: minRows - value.length },
        (_, i) => ({
          id: generateTempId(),
          name: '',
          phone: '',
          email: null,
          role: allowedRoles?.[0] || RepresentativeRole.COMMERCIAL,
          isActive: true,
          isNew: true,
          isEditing: false, // Start with combobox visible, not edit mode (matches web)
          isSaving: false,
          error: null,
          customerId: customerId || null, // Default to primary customer
        })
      );
      onChange([...value, ...emptyRows]);
    }
  }, [value.length, minRows, onChange, allowedRoles, customerId]);

  // Add a new representative row
  const handleAddRow = useCallback(() => {
    if (value.length >= maxRows) {
      Alert.alert('Limite atingido', `Máximo de ${maxRows} representantes permitido`);
      return;
    }

    const newRow: RepresentativeRowData = {
      id: generateTempId(),
      name: '',
      phone: '',
      email: null,
      role: allowedRoles?.[0] || RepresentativeRole.COMMERCIAL,
      isActive: true,
      isNew: true,
      isEditing: false, // Start with combobox visible, not edit mode (matches web)
      isSaving: false,
      error: null,
      customerId: customerId || null, // Default to primary customer
    };

    onChange([...value, newRow]);
  }, [value, maxRows, allowedRoles, onChange, customerId]);

  // Update a specific row (using index like web version)
  const handleUpdateRow = useCallback(
    (index: number, updates: Partial<RepresentativeRowData>) => {
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
        Alert.alert('Mínimo de representantes', `Você deve ter pelo menos ${minRows} representante(s)`);
        return;
      }
      const updatedRows = value.filter((_, i) => i !== index);
      onChange(updatedRows);
    },
    [value, minRows, onChange]
  );

  // Get IDs of already selected representatives (used for per-row filtering)
  const selectedRepIds = useMemo(() => {
    return value
      .filter((row) => !row.isNew && row.id && !row.id.startsWith('temp-'))
      .map((row) => row.id);
  }, [value]);

  // Get filtered representatives for a specific row index
  // Excludes representatives selected in OTHER rows, but keeps the current row's selection
  const getFilteredRepresentativesForRow = useCallback(
    (rowIndex: number) => {
      const currentRowId = value[rowIndex]?.id;
      const otherSelectedIds = selectedRepIds.filter((id) => id !== currentRowId);
      return availableRepresentatives.filter((rep) => !otherSelectedIds.includes(rep.id));
    },
    [availableRepresentatives, selectedRepIds, value]
  );

  const canAddMore = value.length < maxRows && !disabled && !readOnly;

  return (
    <View style={styles.container}>
      {/* Representative rows */}
      {value.length > 0 ? (
        <View style={styles.rowsContainer}>
          {value.map((row, index) => (
            <RepresentativeRow
              key={row.id}
              row={row}
              index={index}
              customerId={customerId || ''}
              invoiceToId={invoiceToId || ''}
              invoiceToCustomerIds={invoiceToCustomers?.map(c => c.id)}
              customerOptions={customerOptions}
              availableRepresentatives={getFilteredRepresentativesForRow(index)}
              loadingRepresentatives={loading}
              onUpdate={(updates) => handleUpdateRow(index, updates)}
              onRemove={() => handleRemoveRow(index)}
              disabled={disabled || loading}
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
