import { useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { getCustomers } from "@/api-client";
import { useTheme } from "@/lib/theme";
import type { Customer } from "@/types";

interface CustomerSelectorProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  initialCustomer?: Customer;
}

// Format CNPJ: 12.345.678/0001-90
function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Format CPF: 123.456.789-01
function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function CustomerSelector({
  value,
  onValueChange,
  disabled = false,
  error,
  label = "Cliente",
  placeholder = "Selecione um cliente",
  required = false,
  initialCustomer,
}: CustomerSelectorProps) {
  const { colors } = useTheme();

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => initialCustomer ? [initialCustomer] : [], [initialCustomer?.id]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((customer: Customer) => customer.fantasyName, []);
  const getOptionValue = useCallback((customer: Customer) => customer.id, []);

  // Search function for Combobox - optimized for performance
  const searchCustomers = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Customer[];
    hasMore: boolean;
  }> => {
    try {
      const params: any = {
        orderBy: { fantasyName: "asc" },
        page: page,
        take: 20, // Reduced from 50 for faster loads
        // Optimized select - only essential fields
        select: {
          id: true,
          fantasyName: true,
          cnpj: true,
          cpf: true,
          corporateName: true,
          // NO logo field in dropdown - saves significant bandwidth
          // Logo can be loaded separately if needed for selected customer
        },
      };

      // Only add search filter if there's a search term
      if (search && search.trim()) {
        params.searchingFor = search.trim();
      }

      const response = await getCustomers(params);
      const customers = response?.data || [];
      const hasMore = response?.meta?.hasNextPage || false;

      return {
        data: customers,
        hasMore: hasMore,
      };
    } catch (error) {
      console.error('[CustomerSelector] Error fetching customers:', error);
      return { data: [], hasMore: false };
    }
  }, []);

  // Custom render option with logo and metadata
  const renderOption = useCallback(
    (option: any, isSelected: boolean, _onPress: () => void) => {
      // Defensive check: option is the Customer object directly
      const customer = option as Customer;

      // Additional safety check
      if (!customer) {
        console.warn('[CustomerSelector] Received undefined customer in renderOption');
        return null;
      }

      return (
        <View style={styles.optionContainer}>
          {/* Customer Logo - Simple colored circle for performance */}
          <View style={[
            styles.simpleLogo,
            { backgroundColor: colors.primary + '20', borderColor: colors.primary }
          ]}>
            <Text style={[styles.logoText, { color: colors.primary }]}>
              {customer?.fantasyName?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.customerInfo}>
            {/* Fantasy Name (Primary) */}
            <Text
              style={[
                styles.fantasyName,
                { color: colors.foreground },
                isSelected && styles.selectedText,
              ]}
              numberOfLines={1}
            >
              {customer?.fantasyName || ""}
            </Text>

            {/* Corporate Name & CNPJ/CPF (Secondary) */}
            <View style={styles.secondaryInfo}>
              {customer?.corporateName && (
                <Text
                  style={[styles.secondaryText, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {customer.corporateName}
                </Text>
              )}

              {(customer?.cnpj || customer?.cpf) && (
                <>
                  {customer?.corporateName && (
                    <Text style={[styles.separator, { color: colors.mutedForeground }]}>
                      {" • "}
                    </Text>
                  )}
                  <Text style={[styles.secondaryText, { color: colors.mutedForeground }]}>
                    {customer.cnpj
                      ? formatCNPJ(customer.cnpj)
                      : customer.cpf
                      ? formatCPF(customer.cpf)
                      : ""}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      );
    },
    [colors]
  );

  return (
    <Combobox<Customer>
      value={value || ""}
      onValueChange={(newValue) => {
        onValueChange?.(newValue as string | undefined);
      }}
      placeholder={placeholder}
      searchPlaceholder="Buscar cliente..."
      emptyText="Nenhum cliente encontrado"
      disabled={disabled}
      error={error}
      async={true}
      queryKey={["customers", "search"]}
      queryFn={searchCustomers}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={!required}
      minSearchLength={0}
      pageSize={20}
      debounceMs={500}
      loadOnMount={false} // Only load when dropdown opens
    />
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  simpleLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  fantasyName: {
    fontSize: 16, // fontSize.base
    fontWeight: "500" as any, // fontWeight.medium
  },
  selectedText: {
    fontWeight: "600" as any, // fontWeight.semibold
  },
  secondaryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  secondaryText: {
    fontSize: 14, // fontSize.sm
  },
  separator: {
    fontSize: 14, // fontSize.sm
  },
});
