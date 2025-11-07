import React, { useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeDeliveries } from "@/hooks";
import { ThemedView } from "@/components/ui/themed-view";
import { Header } from "@/components/ui/header";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

// Import detail card components
import { PpeDeliveryCard, PpeItemCard, CertificateCard } from "@/components/personal/ppe-delivery/detail";

export default function PpeDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDeliveries({
    where: { id },
    include: {
      user: true,
      reviewedByUser: true,
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      ppeSchedule: true,
    },
  });

  const delivery = response?.data?.[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !delivery) {
    return (
      <ThemedView style={styles.container}>
        <Header title="Detalhes da Entrega" showBackButton />
        <ErrorScreen
          message={error ? "Erro ao carregar entrega" : "Entrega não encontrada"}
          detail={error?.message || "A entrega solicitada não existe ou foi removida"}
          onRetry={error ? handleRefresh : undefined}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Detalhes da Entrega",
          headerShown: false,
        }}
      />
      <Header title="Detalhes da Entrega" showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Header Card with Item Name */}
        <Card style={[styles.headerCard, { backgroundColor: colors.primary + "10" }]}>
          <View style={styles.headerContent}>
            <Icon name="package" size={40} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <ThemedText style={styles.headerTitle}>{delivery.item?.name || "EPI"}</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Entrega #{delivery.id.slice(0, 8)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Delivery Information Card */}
        <PpeDeliveryCard delivery={delivery} />

        {/* PPE Item Information Card */}
        <PpeItemCard item={delivery.item} />

        {/* Certificate Card */}
        <CertificateCard item={delivery.item} />

        {/* Schedule Information */}
        {delivery.ppeSchedule && (
          <Card style={styles.card}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.cardHeaderLeft}>
                <Icon name="clock" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.cardTitle}>Entrega Agendada</ThemedText>
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={[styles.infoBox, { backgroundColor: colors.muted + "20" }]}>
                <Icon name="info-circle" size={16} color={colors.primary} />
                <ThemedText style={[styles.infoText, { color: colors.foreground }]}>
                  Esta entrega faz parte de um cronograma automatizado de distribuição de EPIs.
                </ThemedText>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  card: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  cardContent: {
    gap: spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
});
