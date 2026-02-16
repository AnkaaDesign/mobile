import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useCustomer, useScreenReady } from "@/hooks";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";

import {
  IconBuilding,
  IconEdit,
  IconHistory,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";

// Import modular components
import {
  CustomerCard,
  ContactInfoCard,
  AddressCard,
  TasksTable,
  ServiceOrdersTable,
} from "@/components/administration/customer/detail";
import { CustomerDetailSkeleton } from "@/components/administration/customer/skeleton";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function CustomerDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useCustomer(id, {
    // Use top-level select for optimized data fetching - only fetch fields needed for the detail view
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
        },
      },
      // Tasks with minimal fields for display
      tasks: {
        select: {
          id: true,
          serialNumber: true,
          description: true,
          status: true,
          finishedAt: true,
          term: true,
        },
        take: 10, // Limit initial tasks loaded
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
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Customer Name Header Card */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerLeft, { flex: 1 }]}>
                <IconBuilding size={24} color={colors.primary} />
                <ThemedText style={StyleSheet.flatten([styles.customerName, { color: colors.foreground }])}>
                  {customer.fantasyName}
                </ThemedText>
              </View>
              <View style={styles.headerActions}>
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

          {/* Tasks Table */}
          <TasksTable customer={customer} maxHeight={400} />

          {/* Service Orders Table */}
          <ServiceOrdersTable customer={customer} maxHeight={400} />

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

          {/* Bottom spacing */}
          <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
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
