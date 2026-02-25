import React, { useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { IconTrash, IconAlertCircle, IconPlus } from '@tabler/icons-react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { CustomerCombobox } from '@/components/ui/customer-combobox';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, borderRadius } from '@/constants/design-system';
import { responsibleService } from '@/services/responsibleService';
import {
  Responsible,
  ResponsibleRole,
  ResponsibleRowData,
  RESPONSIBLE_ROLE_LABELS,
} from '@/types/responsible';

const CREATE_NEW_OPTION = '__CREATE_NEW__';

// Module-level shared cache so all ResponsibleRow instances can look up responsibles
// regardless of which instance's queryFn was called by React Query (query deduplication)
const responsibleCache = new Map<string, Responsible>();

interface ResponsibleRowProps {
  row: ResponsibleRowData;
  index: number;
  companyId: string;
  onUpdate: (updates: Partial<ResponsibleRowData>) => void;
  onRemove: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  isFirstRow: boolean;
  isLastRow: boolean;
}

export const ResponsibleRow: React.FC<ResponsibleRowProps> = ({
  row,
  index,
  companyId,
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

  // Role options for dropdown
  const roleOptions = useMemo(() => {
    return Object.values(ResponsibleRole).map((role) => ({
      value: role,
      label: RESPONSIBLE_ROLE_LABELS[role],
    }));
  }, []);

  // Async query function for the Combobox
  const queryFn = useCallback(async (searchTerm: string, page?: number) => {
    const response = await responsibleService.getAll({
      search: searchTerm || undefined,
      isActive: true,
      page: page || 1,
      pageSize: 20,
    });
    // Cache fetched responsibles in shared module-level cache
    response.data.forEach(resp => responsibleCache.set(resp.id, resp));
    return {
      data: response.data,
      hasMore: response.meta.page < response.meta.pageCount,
    };
  }, []);

  // Query key for responsibles combobox
  const queryKey = useMemo(() => ['responsibles', 'combobox'], []);

  // Provide the currently selected responsible as initial option so the Combobox can display it
  const initialOptions = useMemo(() => {
    if (row.id && !row.id.startsWith('temp-') && row.name) {
      const resp = { id: row.id, name: row.name, phone: row.phone || '', email: row.email || '', role: row.role, isActive: true } as Responsible;
      responsibleCache.set(resp.id, resp);
      return [resp];
    }
    return [];
  }, [row.id, row.name, row.phone, row.email, row.role]);


  // Handle role change (matches web - resets responsible selection when role changes)
  const handleRoleChange = useCallback(
    (roleValue: string | string[] | null | undefined) => {
      const role = (Array.isArray(roleValue) ? roleValue[0] : roleValue) as ResponsibleRole;
      onUpdate({
        role: role || ResponsibleRole.COMMERCIAL,
        // Reset responsible selection when role changes (matches web behavior)
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

  // Handle responsible selection for non-item cases (clear, create new)
  const handleResponsibleChange = useCallback(
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
      }
      // Regular selection is handled by handleResponsibleSelect (onSelect callback)
    },
    [onUpdate]
  );

  // Handle responsible selection with full item data from Combobox's onSelect.
  // This bypasses the module-level cache, which can miss when React Query
  // serves stale data without re-running the queryFn.
  const handleResponsibleSelect = useCallback(
    (item: Responsible | null) => {
      if (!item) return; // Clearing is handled by handleResponsibleChange
      // Also populate the cache for consistency (e.g., fixedTopContent re-selection)
      responsibleCache.set(item.id, item);
      onUpdate({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email || null,
        // Keep user's role selection instead of overwriting with DB role
        isActive: item.isActive,
        isNew: false,
        isEditing: false,
      });
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

  // Handle customer selection from CustomerCombobox
  const handleCustomerChange = useCallback(
    (customerId: string | null) => {
      onUpdate({ companyId: customerId });
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

  // Option accessors for Responsible type
  const getOptionValue = useCallback((resp: Responsible) => resp.id, []);
  const getOptionLabel = useCallback((resp: Responsible) => `${resp.name} - ${formatPhoneDisplay(resp.phone)}`, []);
  const getOptionDescription = useCallback((resp: Responsible) => resp.email || undefined, []);

  // Fixed top content for "Cadastrar novo" button (pinned between search and scrollable list)
  const fixedTopContent = useMemo(() => (
    <TouchableOpacity
      style={[
        styles.createOption,
        { borderBottomColor: colors.border },
      ]}
      onPress={() => handleResponsibleChange(CREATE_NEW_OPTION)}
    >
      <IconPlus size={20} color={colors.primary} />
      <ThemedText style={[styles.createOptionText, { color: colors.primary }]}>
        Cadastrar novo
      </ThemedText>
    </TouchableOpacity>
  ), [colors, handleResponsibleChange]);

  // Determine the current responsible value for the combobox
  const currentResponsibleValue = row.id && !row.id.startsWith('temp-') ? row.id : '';

  return (
    <View style={styles.container}>
      {showCreateInputs ? (
        /* Inline Create Mode: Role + Name + Phone + Company */
        <>
          {/* Role Selector with Remove Button - only in create mode */}
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

          {/* Customer Combobox for company selection */}
          <View style={styles.companyInput}>
            <CustomerCombobox
              value={row.companyId || null}
              onValueChange={handleCustomerChange}
              disabled={isDisabled}
              placeholder="Selecione a empresa"
            />
          </View>
        </>
      ) : (
        /* Selection Mode: Just the Responsible combobox + remove button */
        <View style={styles.roleRow}>
          <View style={styles.roleSelector}>
            <Combobox<Responsible>
              value={currentResponsibleValue}
              onValueChange={handleResponsibleChange}
              onSelect={handleResponsibleSelect}
              async
              queryKey={queryKey}
              queryFn={queryFn}
              initialOptions={initialOptions}
              minSearchLength={0}
              getOptionValue={getOptionValue}
              getOptionLabel={getOptionLabel}
              getOptionDescription={getOptionDescription}
              placeholder="Selecione ou cadastre novo"
              disabled={isDisabled}
              searchable={true}
              clearable={false}
              fixedTopContent={fixedTopContent}
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
  companyInput: {
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
