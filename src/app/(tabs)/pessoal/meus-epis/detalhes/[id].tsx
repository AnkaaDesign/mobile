import { useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePpeDelivery, useScreenReady} from '@/hooks';
import { ThemedView } from "@/components/ui/themed-view";
import { Header } from "@/components/ui/header";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";

// Import detail card components
import { PpeDeliveryCard, PpeItemCard, CertificateCard } from "@/components/personal/ppe-delivery/detail";


import { Skeleton } from "@/components/ui/skeleton";export default function PpeDeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDelivery(id || '', {
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
    enabled: !!id,
  });

  useScreenReady(!isLoading);

  const delivery = response?.data;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header card skeleton */}
        <View style={{ margin: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Skeleton style={{ width: 40, height: 40, borderRadius: 20 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton style={{ height: 20, width: '60%', borderRadius: 4 }} />
              <Skeleton style={{ height: 14, width: '35%', borderRadius: 4 }} />
            </View>
          </View>
        </View>
        {/* Delivery info card skeleton */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
          <View style={{ gap: 10 }}>
            {[['30%', '30%'], ['35%', '25%'], ['28%', '35%']].map(([l, r], i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={l} height={14} borderRadius={4} />
                <Skeleton width={r} height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
        {/* Item info card skeleton */}
        <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '40%', borderRadius: 4 }} />
          <View style={{ gap: 10 }}>
            {[['25%', '40%'], ['30%', '20%']].map(([l, r], i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={l} height={14} borderRadius={4} />
                <Skeleton width={r} height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
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
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerLeft}>
                <Icon name="clock" size={20} color={colors.mutedForeground} />
                <ThemedText style={styles.title}>Entrega Agendada</ThemedText>
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
