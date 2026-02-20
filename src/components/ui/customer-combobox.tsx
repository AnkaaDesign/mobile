import { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Combobox } from '@/components/ui/combobox';
import { getCustomers, quickCreateCustomer } from '@/api-client/customer';
import { CustomerLogoDisplay } from '@/components/ui/customer-logo-display';
import { useTheme } from '@/lib/theme';
import type { Customer } from '@/types';

// Format CNPJ: 12.345.678/0001-90
function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Format CPF: 123.456.789-01
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

interface CustomerComboboxProps {
  value?: string | null;
  onValueChange: (customerId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  initialCustomer?: Customer;
  label?: string;
}

export function CustomerCombobox({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Selecione uma empresa',
  initialCustomer,
}: CustomerComboboxProps) {
  const { colors } = useTheme();
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const initialOptions = useMemo(
    () => (initialCustomer ? [initialCustomer] : []),
    [initialCustomer?.id],
  );

  const getOptionLabel = useCallback(
    (customer: Customer) => customer.corporateName || customer.fantasyName,
    [],
  );
  const getOptionValue = useCallback(
    (customer: Customer) => customer.id,
    [],
  );

  const searchCustomers = useCallback(
    async (
      search: string,
      page: number = 1,
    ): Promise<{
      data: Customer[];
      hasMore: boolean;
    }> => {
      try {
        const params: any = {
          orderBy: { fantasyName: 'asc' },
          page,
          take: 20,
          select: {
            id: true,
            fantasyName: true,
            cnpj: true,
            cpf: true,
            corporateName: true,
            logoId: true,
            logo: { select: { id: true } },
          },
        };

        if (search && search.trim()) {
          params.searchingFor = search.trim();
        }

        const response = await getCustomers(params);
        const customers = response?.data || [];
        const hasMore = response?.meta?.hasNextPage || false;
        return { data: customers, hasMore };
      } catch {
        return { data: [], hasMore: false };
      }
    },
    [],
  );

  const handleCreateCustomer = useCallback(
    async (searchText: string): Promise<Customer> => {
      setIsCreatingCustomer(true);
      try {
        const result = await quickCreateCustomer({ fantasyName: searchText });
        if (result.data) {
          return result.data;
        }
        throw new Error('Failed to create customer');
      } finally {
        setIsCreatingCustomer(false);
      }
    },
    [],
  );

  const renderOption = useCallback(
    (option: any, isSelected: boolean) => {
      const customer = option as Customer;
      if (!customer) return null;

      return (
        <View style={styles.optionContainer}>
          <CustomerLogoDisplay
            logo={customer?.logo}
            customerName={customer?.corporateName || customer?.fantasyName || ''}
            size="sm"
            shape="rounded"
          />
          <View style={styles.customerInfo}>
            <Text
              style={[
                styles.fantasyName,
                { color: colors.foreground },
                isSelected && styles.selectedText,
              ]}
              numberOfLines={1}
            >
              {customer?.corporateName || customer?.fantasyName || ''}
            </Text>
            <View style={styles.secondaryInfo}>
              {customer?.fantasyName && (
                <Text
                  style={[styles.secondaryText, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {customer.fantasyName}
                </Text>
              )}
              {(customer?.cnpj || customer?.cpf) && (
                <>
                  {customer?.corporateName && (
                    <Text style={[styles.separator, { color: colors.mutedForeground }]}>
                      {' \u2022 '}
                    </Text>
                  )}
                  <Text style={[styles.secondaryText, { color: colors.mutedForeground }]}>
                    {customer.cnpj
                      ? formatCNPJ(customer.cnpj)
                      : customer.cpf
                        ? formatCPF(customer.cpf)
                        : ''}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      );
    },
    [colors],
  );

  return (
    <Combobox<Customer>
      value={value || ''}
      onValueChange={(newValue) => {
        onValueChange((newValue as string) || null);
      }}
      placeholder={placeholder}
      searchPlaceholder="Buscar empresa..."
      emptyText="Nenhuma empresa encontrada"
      disabled={disabled || isCreatingCustomer}
      async={true}
      allowCreate={true}
      createLabel={(val) => `Criar cliente "${val}"`}
      onCreate={handleCreateCustomer}
      queryKey={['customers', 'search', 'customer-combobox']}
      queryFn={searchCustomers}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={true}
      minSearchLength={0}
      pageSize={20}
      debounceMs={500}
      loadOnMount={false}
    />
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  customerInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  fantasyName: {
    fontSize: 16,
    fontWeight: '500' as any,
  },
  selectedText: {
    fontWeight: '600' as any,
  },
  secondaryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  secondaryText: {
    fontSize: 14,
  },
  separator: {
    fontSize: 14,
  },
});
