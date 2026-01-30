import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { usePpeDelivery } from "@/hooks/usePpe";
import { routes, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconShield, IconRefresh, IconEdit } from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
// import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

// Import modular components
import { DeliveryCard, EmployeeCard, ItemDetailsCard } from "@/components/human-resources/ppe/delivery/detail";
import { PpeDeliveryDetailSkeleton } from "@/components/human-resources/ppe/delivery/skeleton";

export default function HRPPEDeliveryDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDelivery(id, {
    include: {
      user: {
        include: {
          position: {
            include: {
              sector: true,
            },
          },
        },
      },
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      ppeSchedule: true,
    },
    enabled: !!id && id !== "",
  });

  const delivery = response?.data;

  const handleEdit = () => {
    if (delivery) {
      router.push(routeToMobilePath(routes.humanResources.ppe.deliveries.edit(delivery.id)) as any);
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
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header title="Detalhes da Entrega" showBackButton={true} onBackPress={() => router.back()} />
        <PpeDeliveryDetailSkeleton />
      </View>
    );
  }

  if (error || !delivery || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
        <Header title="Detalhes da Entrega" showBackButton={true} onBackPress={() => router.back()} />
        <ScrollView style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                  <IconShield size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Entrega não encontrada</ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                  A entrega de EPI solicitada não foi encontrada ou pode ter sido removida.
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

  const canEdit = delivery.status === "PENDING" || delivery.status === "APPROVED";

  return (
    <View style={StyleSheet.flatten([styles.screenContainer, { backgroundColor: colors.background }])}>
      {/* Header */}
      <Header
        title="Detalhes da Entrega"
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
            {canEdit && (
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
            )}
          </View>
        }
      />

      <ScrollView
        style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Modular Components */}
          <DeliveryCard delivery={delivery} />
          <EmployeeCard delivery={delivery} />
          <ItemDetailsCard delivery={delivery} />

          {/* Changelog Timeline */}
          <Card>
            <CardContent>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY}
                entityId={delivery.id}
                entityName={`Entrega #${delivery.id.slice(0, 8)}`}
                entityCreatedAt={delivery.createdAt}
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
});
