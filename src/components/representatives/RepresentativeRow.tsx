import React, { useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { IconTrash, IconAlertCircle, IconPlus } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { representativeService } from '@/services/representativeService';
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
  invoiceToId?: string; // Billing customer (legacy single)
  invoiceToCustomerIds?: string[]; // Multiple billing customer IDs from pricing
  customerOptions?: CustomerOption[]; // Options for customer selection when creating new representatives
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
  invoiceToCustomerIds,
  customerOptions = [],
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

  // Cache fetched representatives for lookup on selection
  const fetchedRepsRef = useRef<Map<string, Representative>>(new Map());

  // Async query function for the Combobox
  const queryFn = useCallback(async (searchTerm: string, page?: number) => {
    if (!row.role) return { data: [] as Representative[], hasMore: false };
    const response = await representativeService.getAll({
      search: searchTerm || undefined,
      role: row.role as RepresentativeRole,
      isActive: true,
      page: page || 1,
      pageSize: 20,
    });
    // Cache fetched reps for lookup on selection
    response.data.forEach(rep => fetchedRepsRef.current.set(rep.id, rep));
    return {
      data: response.data,
      hasMore: response.meta.page < response.meta.pageCount,
    };
  }, [row.role]);

  // Query key changes when role changes, triggering a re-fetch
  const queryKey = useMemo(() => ['representatives', 'combobox', row.role], [row.role]);

  // Provide the currently selected rep as initial option so the Combobox can display it
  const initialOptions = useMemo(() => {
    if (row.id && !row.id.startsWith('temp-') && row.name) {
      const rep = { id: row.id, name: row.name, phone: row.phone || '', email: row.email || '', role: row.role, isActive: true } as Representative;
      fetchedRepsRef.current.set(rep.id, rep);
      return [rep];
    }
    return [];
  }, [row.id, row.name, row.phone, row.email, row.role]);


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
        // Find selected representative from cache
        const selectedRep = fetchedRepsRef.current.get(selectedValue);
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
    [onUpdate]
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

  const isDisabled = disabled || readOnly || row.isSaving;

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

  // Option accessors for Representative type
  const getOptionValue = useCallback((rep: Representative) => rep.id, []);
  const getOptionLabel = useCallback((rep: Representative) => `${rep.name} - ${formatPhoneDisplay(rep.phone)}`, []);
  const getOptionDescription = useCallback((rep: Representative) => rep.email || undefined, []);

  // Fixed top content for "Cadastrar novo" button (pinned between search and scrollable list)
  const fixedTopContent = useMemo(() => (
    <TouchableOpacity
      style={[
        styles.createOption,
        { borderBottomColor: colors.border },
      ]}
      onPress={() => handleRepresentativeChange(CREATE_NEW_OPTION)}
    >
      <IconPlus size={20} color={colors.primary} />
      <Text style={[styles.createOptionText, { color: colors.primary }]}>
        Cadastrar novo
      </Text>
    </TouchableOpacity>
  ), [colors, handleRepresentativeChange]);

  // Determine the current representative value for the combobox
  const currentRepresentativeValue = row.id && !row.id.startsWith('temp-') ? row.id : '';

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
        <Combobox<Representative>
          value={currentRepresentativeValue}
          onValueChange={handleRepresentativeChange}
          async
          queryKey={queryKey}
          queryFn={queryFn}
          initialOptions={initialOptions}
          minSearchLength={0}
          getOptionValue={getOptionValue}
          getOptionLabel={getOptionLabel}
          getOptionDescription={getOptionDescription}
          placeholder={row.role ? 'Selecione ou cadastre novo' : 'Selecione função primeiro'}
          disabled={!row.role || isDisabled}
          searchable={true}
          clearable={false}
          fixedTopContent={fixedTopContent}
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
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  createOptionText: {
    fontSize: fontSize.base,
    fontWeight: '500' as const,
    flex: 1,
  },
});
