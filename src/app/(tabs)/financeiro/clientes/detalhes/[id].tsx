import { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useCustomer } from '@/hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from '@/constants';
import { useAuth } from '@/contexts/auth-context';
import { hasAnyPrivilege } from '@/utils';
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  IconBuilding,
  IconRefresh,
  IconEdit,
  IconHistory,
  IconReceipt2,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
// import { showToast } from "@/components/ui/toast";

// Import modular components
import {
  CustomerCard,
  ContactInfoCard,
  AddressCard,
  TasksTable,
  CustomerDocumentsCard,
  CustomerInvoicesCard,
} from "@/components/administration/customer/detail";
import { CustomerDetailSkeleton } from "@/components/administration/customer/skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

/**
 * Financial Customer Detail Screen
 *
 * Shows customer details from a financial perspective with:
 * - Invoice history and payment status
 * - Financial documents (CNPJ/CPF)
 * - Task financial summaries
 * - Changelog for audit purposes
 */
export default function FinancialCustomerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const id = params?.id || "";

  // Financial module requires ADMIN, FINANCIAL privileges, or team leadership to view documents
  // Team leadership is now determined by managedSector relationship
  const canViewDocuments = user && (hasAnyPrivilege(user, [
    SECTOR_PRIVILEGES.ADMIN,
    SECTOR_PRIVILEGES.FINANCIAL,
  ]) || Boolean(user.managedSector?.id));

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCustomer(id, {
    // Use select for optimized data fetching - only fetch fields needed for the detail view
    select: {
      // Basic identification
      id: true,
      fantasyName: true,
      corporateName: true,
      cnpj: true,
      cpf: true,
      registrationStatus: true,
      tags: true,
      // Contact info
      email: true,
      phones: true,
      site: true,
      // Address
      address: true,
      addressNumber: true,
      addressComplement: true,
      neighborhood: true,
      city: true,
      state: true,
      zipCode: true,
      // Metadata
      createdAt: true,
      logoId: true,
      // Logo relation with minimal fields for display
      logo: {
        select: {
          id: true,
          url: true,
          name: true,
          mimeType: true,
        },
      },
      // Counts for display
      _count: {
        select: {
          tasks: true,
          serviceOrders: true,
          services: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const customer = response?.data;

  const handleEdit = () => {
    if (customer) {
      router.push(routeToMobilePath(routes.financial.customers.edit(customer.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <CustomerDetailSkeleton />
        </View>
      </View>
    );
  }

  if (error || !customer || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconBuilding size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Cliente não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O cliente solicitado não foi encontrado ou pode ter sido removido.
              </ThemedText>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  // Render all content except TasksTable as header
  const renderHeader = () => (
    <View style={styles.container}>
      {/* Customer Name Header Card */}
      <Card style={styles.card}>
        <View style={styles.headerContent}>
          <View style={[styles.headerLeft, { flex: 1 }]}>
            <IconReceipt2 size={24} color={colors.primary} />
            <ThemedText style={StyleSheet.flatten([styles.customerName, { color: colors.foreground }])}>
              {customer.fantasyName}
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Financial Info Badge */}
      <Card style={styles.card}>
        <View style={styles.financialBadge}>
          <IconReceipt2 size={20} color={colors.primary} />
          <ThemedText style={[styles.financialText, { color: colors.foreground }]}>
            Visualização Financeira
          </ThemedText>
        </View>
      </Card>

      {/* Modular Components */}
      <CustomerCard customer={customer} />
      <ContactInfoCard customer={customer} />
      <AddressCard customer={customer} />

      {/* Financial Documents - Always shown in financial module */}
      {canViewDocuments && <CustomerDocumentsCard customer={customer} />}

      {/* Invoices - Priority in financial view */}
      {canViewDocuments && <CustomerInvoicesCard customer={customer} />}
    </View>
  );

  // Render footer with Changelog
  const renderFooter = () => (
    <View style={styles.container}>
      {/* Changelog Timeline */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconHistory size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
          </View>
        </View>
        <View style={[styles.content, { gap: spacing.md }]}>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.CUSTOMER}
            entityId={customer.id}
            entityName={customer.fantasyName}
            entityCreatedAt={customer.createdAt}
            maxHeight={400}
          />
        </View>
      </Card>

      {/* Bottom spacing for mobile navigation */}
      <View style={{ height: spacing.xxl * 2 }} />
    </View>
  );

  // Main data array for FlatList (TasksTable component)
  const data = [{ key: 'tasks', component: <TasksTable customer={customer} maxHeight={400} /> }];

  return (
    <FlatList
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      data={data}
      renderItem={({ item }) => <View style={styles.container}>{item.component}</View>}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  customerName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  financialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  financialText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
