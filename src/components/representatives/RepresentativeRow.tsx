import React, { useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { IconTrash, IconAlertCircle } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import {
  Representative,
  RepresentativeRole,
  RepresentativeRowData,
  REPRESENTATIVE_ROLE_LABELS,
} from '@/types/representative';

const CREATE_NEW_OPTION = '__CREATE_NEW__';

interface CustomerOption {
  id: string;
  name: string;
}

interface RepresentativeRowProps {
  row: RepresentativeRowData;
  index: number;
  customerId: string;
  invoiceToId?: string; // Billing customer - representatives from this customer are also valid
  customerOptions?: CustomerOption[]; // Options for customer selection when creating new representatives
  availableRepresentatives: Representative[];
  loadingRepresentatives: boolean;
  onUpdate: (updates: Partial<RepresentativeRowData>) => void;
  onRemove: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  isFirstRow: boolean;
  isLastRow: boolean;
}

export const RepresentativeRow: React.FC<RepresentativeRowProps> = ({
  row,
  index,
  customerId,
  invoiceToId,
  customerOptions = [],
  availableRepresentatives,
  loadingRepresentatives,
  onUpdate,
  onRemove,
  disabled = false,
  readOnly = false,
  isFirstRow,
  isLastRow,
}) => {
  const { colors } = useTheme();

  // Determine if we're in create mode based on the value (matches web logic)
  const showCreateInputs = row.isEditing && row.id?.startsWith('temp-');

  // Show customer selector only when:
  // 1. In create mode (showCreateInputs)
  // 2. There are multiple customer options (customer and invoiceTo are different)
  const showCustomerSelector = showCreateInputs && customerOptions.length > 1;

  // Handle customer selection for new representatives
  const handleCustomerChange = useCallback(
    (value: string | string[] | null | undefined) => {
      const selectedCustomerId = Array.isArray(value) ? value[0] : value;
      onUpdate({ customerId: selectedCustomerId || null });
    },
    [onUpdate]
  );

  // Build customer options for the dropdown
  const customerSelectOptions = useMemo(() => {
    return customerOptions.map(opt => ({
      value: opt.id,
      label: opt.name,
    }));
  }, [customerOptions]);

  // Role options for dropdown
  const roleOptions = useMemo(() => {
    return Object.values(RepresentativeRole).map((role) => ({
      value: role,
      label: REPRESENTATIVE_ROLE_LABELS[role],
    }));
  }, []);

  // Filter representatives by selected role AND customer (matches web logic)
  // Show: reps matching the role that belong to customer, invoiceTo, or are global
  const filteredRepresentatives = useMemo(() => {
    if (!row.role) return [];

    return availableRepresentatives.filter((rep) => {
      // Filter by role first
      if (rep.role !== row.role) return false;

      // If task has a customer or invoiceTo, show reps that:
      // 1. Belong to the primary customer (customerId), OR
      // 2. Belong to the billing customer (invoiceToId), OR
      // 3. Have no customer (global representatives)
      if (customerId || invoiceToId) {
        return (
          rep.customerId === customerId ||
          rep.customerId === invoiceToId ||
          !rep.customerId
        );
      }

      // If no customer on task, show all representatives with this role
      return true;
    });
  }, [availableRepresentatives, row.role, customerId, invoiceToId]);


  // Handle role change (matches web - resets representative selection when role changes)
  const handleRoleChange = useCallback(
    (roleValue: string | string[] | null | undefined) => {
      const role = (Array.isArray(roleValue) ? roleValue[0] : roleValue) as RepresentativeRole;
      onUpdate({
        role: role || RepresentativeRole.COMMERCIAL,
        // Reset representative selection when role changes (matches web behavior)
        id: `temp-${Date.now()}`,
        name: '',
        phone: '',
        email: null,
        isNew: true,
        isEditing: false, // Start with combobox visible, not edit mode
      });
    },
    [onUpdate]
  );

  // Handle representative selection (matches web workflow)
  const handleRepresentativeChange = useCallback(
    (value: string | string[] | null | undefined) => {
      const selectedValue = Array.isArray(value) ? value[0] : value;

      // Handle null/undefined - allow clearing the selection
      if (!selectedValue) {
        onUpdate({
          id: '',
          name: '',
          phone: '',
          email: null,
          isNew: false,
          isEditing: false,
        });
        return;
      }

      if (selectedValue === CREATE_NEW_OPTION) {
        // Switch to create mode (matches web behavior)
        onUpdate({
          id: `temp-${Date.now()}`,
          name: '',
          phone: '',
          email: null,
          isNew: true,
          isEditing: true, // This will trigger showCreateInputs
        });
      } else {
        // Find selected representative and copy its data
        const selectedRep = filteredRepresentatives.find((rep) => rep.id === selectedValue);
        if (selectedRep) {
          onUpdate({
            id: selectedRep.id,
            name: selectedRep.name,
            phone: selectedRep.phone,
            email: selectedRep.email || null,
            role: selectedRep.role,
            isActive: selectedRep.isActive,
            isNew: false,
            isEditing: false,
          });
        }
      }
    },
    [filteredRepresentatives, onUpdate]
  );

  // Handle input changes for create mode
  const handleNameChange = useCallback(
    (name: string) => {
      onUpdate({ name });
    },
    [onUpdate]
  );

  const handlePhoneChange = useCallback(
    (value: string | number | null) => {
      const phone = value !== null ? String(value) : '';
      onUpdate({ phone });
    },
    [onUpdate]
  );

  const handleEmailChange = useCallback(
    (email: string) => {
      onUpdate({ email: email || null });
    },
    [onUpdate]
  );

  const isDisabled = disabled || readOnly || row.isSaving || loadingRepresentatives;

  // Format phone for display (matches web)
  const formatPhoneDisplay = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 0) return phone;
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
    return phone;
  };

  // Build representative options - "Cadastrar novo" first, then existing representatives (matches web)
  // Always include the currently selected representative even if not in filtered list
  const representativeOptions = useMemo(() => {
    const options = [
      {
        value: CREATE_NEW_OPTION,
        label: 'Cadastrar novo',
        description: 'Criar novo representante',
      },
      ...filteredRepresentatives.map((rep) => ({
        value: rep.id,
        label: `${rep.name} - ${formatPhoneDisplay(rep.phone)}`,
        description: rep.email || undefined,
      })),
    ];

    // If current row has an existing representative (non-temp ID with data),
    // ensure it's in options even if not in filtered list (handles loading state, etc.)
    const isExistingRep = row.id && !row.id.startsWith('temp-') && row.name;
    const isAlreadyInOptions = filteredRepresentatives.some((rep) => rep.id === row.id);

    if (isExistingRep && !isAlreadyInOptions) {
      options.push({
        value: row.id,
        label: `${row.name} - ${formatPhoneDisplay(row.phone)}`,
        description: row.email || undefined,
      });
    }

    return options;
  }, [filteredRepresentatives, row.id, row.name, row.phone, row.email]);

  // Determine the current representative value for the combobox
  const currentRepresentativeValue = showCreateInputs
    ? CREATE_NEW_OPTION
    : (row.id && !row.id.startsWith('temp-') ? row.id : '');

  return (
    <View style={styles.container}>
      {/* Row 1: Role Selector with Remove Button */}
      <View style={styles.roleRow}>
        <View style={styles.roleSelector}>
          <Combobox
            value={row.role}
            onValueChange={handleRoleChange}
            options={roleOptions}
            placeholder="Selecione a função"
            disabled={isDisabled}
            searchable={false}
            clearable={false}
          />
        </View>
        {!readOnly && !disabled && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.destructive + '15' }]}
            onPress={onRemove}
            disabled={isDisabled}
          >
            <IconTrash size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Row 2: Representative Selection OR Create Mode Inputs */}
      {showCreateInputs ? (
        /* Inline Create Representative Inputs */
        <>
          <View style={styles.createInputsRow}>
            <View style={styles.nameInput}>
              <Input
                value={row.name}
                onChangeText={handleNameChange}
                placeholder="Nome"
                editable={!isDisabled}
                autoFocus
              />
            </View>
            <View style={styles.phoneInput}>
              <Input
                type="phone"
                value={row.phone}
                onChange={handlePhoneChange}
                placeholder="Telefone"
                keyboardType="phone-pad"
                editable={!isDisabled}
              />
            </View>
          </View>
          {/* Customer Selector - only shown when there are multiple customer options */}
          {showCustomerSelector && (
            <Combobox
              value={row.customerId || customerOptions[0]?.id || ''}
              onValueChange={handleCustomerChange}
              options={customerSelectOptions}
              placeholder="Selecione o cliente"
              disabled={isDisabled}
              searchable={false}
              clearable={false}
              getOptionValue={(opt) => opt.value}
              getOptionLabel={(opt) => opt.label}
            />
          )}
        </>
      ) : (
        /* Representative Selection */
        <Combobox
          value={currentRepresentativeValue}
          onValueChange={handleRepresentativeChange}
          options={representativeOptions}
          placeholder={row.role ? 'Selecione ou cadastre novo' : 'Selecione função primeiro'}
          disabled={!row.role || isDisabled}
          loading={loadingRepresentatives}
          searchable={filteredRepresentatives.length > 5}
          clearable={false}
          getOptionValue={(opt) => opt.value}
          getOptionLabel={(opt) => opt.label}
          getOptionDescription={(opt) => opt.description}
        />
      )}

      {/* Error Display */}
      {row.error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '15' }]}>
          <IconAlertCircle size={16} color={colors.destructive} />
          <ThemedText style={[styles.errorText, { color: colors.destructive }]}>
            {row.error}
          </ThemedText>
        </View>
      )}

      {/* Saving Indicator */}
      {row.isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  roleSelector: {
    flex: 1,
  },
  createInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameInput: {
    flex: 1,
  },
  phoneInput: {
    flex: 1,
  },
  removeButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  savingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
});
