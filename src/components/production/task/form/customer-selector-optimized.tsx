import { useMemo, useCallback, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { CustomerLogoDisplay } from "@/components/ui/customer-logo-display";
import { getCustomers } from "@/api-client";
import { useTheme } from "@/lib/theme";
import type { Customer } from "@/types";

interface CustomerSelectorOptimizedProps {
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

/**
 * OPTIMIZED Customer Selector
 * Key improvements:
 * 1. NO logo loading in dropdown (saves ~500 bytes per customer)
 * 2. Reduced page size from 50 to 20
 * 3. Only fetches data when dropdown is opened
 * 4. Minimal fields selected for list display
 */
export function CustomerSelectorOptimized({
  value,
  onValueChange,
  disabled = false,
  error,
  label = "Cliente",
  placeholder = "Selecione um cliente",
  required = false,
  initialCustomer,
}: CustomerSelectorOptimizedProps) {
  const { colors } = useTheme();
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const dropdownOpenCount = useRef(0);

  // Memoize initialOptions to prevent infinite loop
  const initialOptions = useMemo(() => {
    // If we have an initial customer, create a minimal version without logo
    if (initialCustomer) {
      return [{
        ...initialCustomer,
        logo: null // Don't load logo for initial option
      }];
    }
    return [];
  }, [initialCustomer?.id]);

  // Memoize callbacks to prevent infinite loop
  const getOptionLabel = useCallback((customer: Customer) => customer.fantasyName, []);
  const getOptionValue = useCallback((customer: Customer) => customer.id, []);

  // OPTIMIZED Search function - minimal includes, smaller page size
  const searchCustomers = useCallback(async (
    search: string,
    page: number = 1,
  ): Promise<{
    data: Customer[];
    hasMore: boolean;
  }> => {
    // Track that dropdown has been opened
    if (!hasOpenedOnce) {
      setHasOpenedOnce(true);
      dropdownOpenCount.current++;
      console.log(`🎯 [Customer Dropdown] Opened for the first time`);
    }

    try {
      const params: any = {
        orderBy: { fantasyName: "asc" },
        page: page,
        take: 20, // REDUCED from 50 to 20 for faster loads
        // NO includes - just basic customer data
        select: {
          id: true,
          fantasyName: true,
          corporateName: true,
          cnpj: true,
          cpf: true,
          // NO logo field - saves significant bandwidth
        }
      };

      // Only add search filter if there's a search term
      if (search && search.trim()) {
        params.searchingFor = search.trim();
      }

      console.log(`🔍 [Customer Selector] Fetching page ${page} with minimal data`);
      const startTime = performance.now();

      const response = await getCustomers(params);

      const duration = performance.now() - startTime;
      console.log(`✅ [Customer Selector] Loaded ${response?.data?.length || 0} customers in ${duration.toFixed(0)}ms`);

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
  }, [hasOpenedOnce]);

  // Simplified render option without logo
  const renderOption = useCallback(
    (option: any, isSelected: boolean, _onPress: () => void) => {
      const customer = option as Customer;

      if (!customer) {
        console.warn('[CustomerSelector] Received undefined customer in renderOption');
        return null;
      }

      return (
        <View style={styles.optionContainer}>
          {/* Simple colored circle instead of logo - much faster */}
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

            {/* CNPJ/CPF only - no corporate name to save space */}
            {(customer?.cnpj || customer?.cpf) && (
              <Text style={[styles.secondaryText, { color: colors.mutedForeground }]}>
                {customer.cnpj
                  ? formatCNPJ(customer.cnpj)
                  : customer.cpf
                  ? formatCPF(customer.cpf)
                  : ""}
              </Text>
            )}
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
      queryKey={["customers", "search", "optimized"]} // Different cache key
      queryFn={searchCustomers}
      initialOptions={initialOptions}
      getOptionLabel={getOptionLabel}
      getOptionValue={getOptionValue}
      renderOption={renderOption}
      clearable={!required}
      minSearchLength={0}
      pageSize={20} // REDUCED from 50 to 20
      debounceMs={200} // REDUCED from 300 to 200 for faster response
      // Only load when dropdown opens, not on mount
      loadOnMount={false}
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
    gap: 2,
    minWidth: 0,
  },
  fantasyName: {
    fontSize: 15,
    fontWeight: "500" as any,
  },
  selectedText: {
    fontWeight: "600" as any,
  },
  secondaryText: {
    fontSize: 12,
  },
});