import { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Combobox } from "@/components/ui/combobox";
import { CustomerLogoDisplay } from "@/components/ui/customer-logo-display";
import { useCustomers, useCustomer } from "@/hooks";
import { useTheme } from "@/lib/theme";
import { fontSize, fontWeight, spacing } from "@/constants/design-system";
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
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Fetch the selected customer if value is provided but not in initialCustomer
  const shouldFetchSelectedCustomer = value && (!initialCustomer || initialCustomer.id !== value);
  const { data: selectedCustomer } = useCustomer(
    value || "",
    { include: { logo: true }, enabled: !!shouldFetchSelectedCustomer }
  );

  // Fetch customers with pagination
  const { data: customersResponse, isLoading } = useCustomers({
    searchingFor: searchText,
    orderBy: { fantasyName: "asc" },
    page,
    take: pageSize,
    include: { logo: true },
  });

  const customers = customersResponse?.data || [];
  const hasMore = customersResponse?.meta?.hasNextPage || false;

  // Combine initial customer with fetched customers
  const allCustomers = useMemo(() => {
    const customerList = [...customers];

    // Add selected customer if fetched and not in list
    if (selectedCustomer?.data && !customerList.some(c => c.id === selectedCustomer.data!.id)) {
      customerList.unshift(selectedCustomer.data);
    }

    // Add initial customer if provided and not already in list
    if (initialCustomer && !customerList.some(c => c.id === initialCustomer.id)) {
      customerList.unshift(initialCustomer);
    }

    return customerList;
  }, [customers, initialCustomer, selectedCustomer]);

  // Map to combobox options
  const options = useMemo(() => {
    return allCustomers.map((customer) => ({
      value: customer.id,
      label: customer.fantasyName,
      customer, // Store full customer object for rendering
    }));
  }, [allCustomers]);

  // Handle load more
  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isLoading, hasMore]);

  // Handle search change - reset pagination
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    setPage(1);
  }, []);

  // Custom render option with logo and metadata
  const renderOption = useCallback(
    (option: any, isSelected: boolean, _onPress: () => void) => {
      const customer = option.customer as Customer;

      return (
        <View style={styles.optionContainer}>
          {/* Customer Logo - ensure it's always rendered */}
          <CustomerLogoDisplay
            logo={customer.logo || null}
            customerName={customer.fantasyName || ""}
            size="sm"
            shape="rounded"
          />

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
              {customer.fantasyName}
            </Text>

            {/* Corporate Name & CNPJ/CPF (Secondary) */}
            <View style={styles.secondaryInfo}>
              {customer.corporateName && (
                <Text
                  style={[styles.secondaryText, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {customer.corporateName}
                </Text>
              )}

              {(customer.cnpj || customer.cpf) && (
                <>
                  {customer.corporateName && (
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
    <Combobox
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      label={required ? `${label} *` : label}
      searchPlaceholder="Buscar cliente..."
      emptyText="Nenhum cliente encontrado"
      disabled={disabled}
      error={error}
      loading={isLoading && page === 1}
      onSearchChange={handleSearchChange}
      onEndReached={handleEndReached}
      renderOption={renderOption}
      clearable={!required}
    />
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  customerInfo: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  fantasyName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
  },
  selectedText: {
    fontWeight: fontWeight.semibold as any,
  },
  secondaryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  secondaryText: {
    fontSize: fontSize.sm,
  },
  separator: {
    fontSize: fontSize.sm,
  },
});
