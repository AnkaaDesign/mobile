import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useCustomer } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
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
import { CustomerCard, ContactInfoCard, AddressCard, TasksCard } from "@/components/administration/customer/detail";
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
      tasks: {
        include: {
          user: {
            select: {
              name: true,
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
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
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header
          title="Detalhes do Cliente"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <CustomerDetailSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (error || !customer || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header
          title="Detalhes do Cliente"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
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
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  const totalTasks = customer._count?.tasks || 0;
  const totalServiceOrders = customer._count?.serviceOrders || 0;
  const totalServices = customer._count?.services || 0;

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Enhanced Header */}
      <Header
        title={customer.fantasyName}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

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
          {/* Quick Stats Cards */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor: isDark ? extendedColors.blue[900] + "40" : extendedColors.blue[100],
                    },
                  ]}
                >
                  <IconClipboardList
                    size={20}
                    color={isDark ? extendedColors.blue[400] : extendedColors.blue[600]}
                  />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                    {totalTasks}
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    tarefas
                  </ThemedText>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.statCard}>
              <CardContent style={styles.statContent}>
                <View
                  style={[
                    styles.statIcon,
                    {
                      backgroundColor: isDark ? extendedColors.green[900] + "40" : extendedColors.green[100],
                    },
                  ]}
                >
                  <IconReceipt
                    size={20}
                    color={isDark ? extendedColors.green[400] : extendedColors.green[600]}
                  />
                </View>
                <View style={styles.statInfo}>
                  <ThemedText style={StyleSheet.flatten([styles.statValue, { color: colors.foreground }])}>
                    {totalServiceOrders}
                  </ThemedText>
                  <ThemedText style={StyleSheet.flatten([styles.statLabel, { color: colors.mutedForeground }])}>
                    O.S.
                  </ThemedText>
                </View>
              </CardContent>
            </Card>
          </View>

          {/* Modular Components */}
          <CustomerCard customer={customer} />
          <ContactInfoCard customer={customer} />
          <AddressCard customer={customer} />
          <TasksCard customer={customer} maxHeight={400} />

          {/* Changelog Timeline */}
          <Card>
            <CardContent style={styles.changelogHeader}>
              <View style={styles.titleRow}>
                <View style={StyleSheet.flatten([styles.titleIcon, { backgroundColor: colors.primary + "10" }])}>
                  <IconHistory size={18} color={colors.primary} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.titleText, { color: colors.foreground }])}>
                  Histórico de Alterações
                </ThemedText>
              </View>
            </CardContent>
            <CardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.CUSTOMER}
                entityId={customer.id}
                entityName={customer.fantasyName}
                entityCreatedAt={customer.createdAt}
                maxHeight={400}
              />
            </CardContent>
          </Card>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
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
    paddingHorizontal: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  changelogHeader: {
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
