import React, { useState, useCallback } from "react";
import { View, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useCustomer } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";
import {
  IconBuilding,
  IconRefresh,
  IconEdit,
  IconClipboardList,
  IconHistory,
  IconReceipt,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";

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

export default function CustomerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCustomer(id, {
    include: {
      logo: true,
      _count: {
        tasks: true,
        serviceOrders: true,
        services: true,
      },
    },
    enabled: !!id && id !== "",
  });

  const customer = response?.data;

  const handleEdit = () => {
    if (customer) {
      router.push(routeToMobilePath(routes.administration.customers.edit(customer.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
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
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  const totalTasks = customer._count?.tasks || 0;
  const totalServiceOrders = customer._count?.serviceOrders || 0;
  const totalServices = customer._count?.services || 0;

  // Render all content except TasksTable as header
  const renderHeader = () => (
    <View style={styles.container}>
      {/* Customer Name Header Card */}
      <Card style={styles.card}>
        <View style={styles.headerContent}>
          <View style={[styles.headerLeft, { flex: 1 }]}>
            <IconBuilding size={24} color={colors.primary} />
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

      {/* Modular Components */}
      <CustomerCard customer={customer} />
      <ContactInfoCard customer={customer} />
      <AddressCard customer={customer} />
      <CustomerDocumentsCard customer={customer} />
      <CustomerInvoicesCard customer={customer} />
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
        <View style={styles.content}>
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
