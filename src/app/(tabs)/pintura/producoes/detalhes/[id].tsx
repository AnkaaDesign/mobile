import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, StyleSheet, RefreshControl, Alert } from "react-native";
import { useState, useCallback } from "react";
import { usePaintProductionDetail, useScreenReady } from "@/hooks";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconHistory } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { ProductionInfoCard, PaintFormulaCard, ComponentsUsedCard } from "@/components/painting/production/detail";

import { Skeleton } from "@/components/ui/skeleton";

// import { showToast } from "@/components/ui/toast";

export default function ProductionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts

  const {
    data: productionResponse,
    isLoading,
    error,
    refetch,
  } = usePaintProductionDetail(id as string, {
    include: {
      formula: {
        include: {
          paint: true,
          components: {
            include: {
              item: true,
            },
          },
        },
      },
    },
  });

  useScreenReady(!isLoading);

  const production = productionResponse?.data;
  const paint = production?.formula?.paint;

  const productionEntity = {
    id: production?.id || "",
    name: paint ? `Produção de ${paint.name}` : `Produção ${id?.slice(0, 8)}`,
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
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 16, gap: 16, paddingBottom: 32 }}>
            {/* ProductionInfoCard skeleton: status, volume, dates */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
                <Skeleton style={{ height: 22, width: 70, borderRadius: 10, marginLeft: 'auto' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[1, 2].map((i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 8, padding: 12, gap: 6 }}>
                    <Skeleton style={{ height: 12, width: '60%', borderRadius: 4 }} />
                    <Skeleton style={{ height: 22, width: '70%', borderRadius: 4 }} />
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 13, width: '35%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '40%', borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 13, width: '30%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '45%', borderRadius: 4 }} />
              </View>
            </View>
            {/* PaintFormulaCard skeleton: paint name + formula info */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '40%', borderRadius: 4 }} />
              </View>
              {/* Color swatch + paint name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton style={{ width: 48, height: 48, borderRadius: 6 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
                  <Skeleton style={{ height: 13, width: '40%', borderRadius: 4 }} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 13, width: '30%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '35%', borderRadius: 4 }} />
              </View>
            </View>
            {/* ComponentsUsedCard skeleton: list of components */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
              </View>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border + '60' }}>
                  <Skeleton style={{ width: 32, height: 32, borderRadius: 6 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 14, width: `${50 + i * 10}%`, borderRadius: 4 }} />
                    <Skeleton style={{ height: 11, width: '30%', borderRadius: 4 }} />
                  </View>
                  <Skeleton style={{ height: 14, width: 60, borderRadius: 4 }} />
                </View>
              ))}
            </View>
            {/* Changelog card skeleton */}
            <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                <Skeleton style={{ width: 20, height: 20, borderRadius: 4 }} />
                <Skeleton style={{ height: 16, width: '55%', borderRadius: 4 }} />
              </View>
              {[1, 2].map((i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                  <Skeleton style={{ width: 10, height: 10, borderRadius: 5, marginTop: 4 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Skeleton style={{ height: 13, width: '75%', borderRadius: 4 }} />
                    <Skeleton style={{ height: 11, width: '45%', borderRadius: 4 }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </>
    );
  }

  if (error || !production) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen title="Erro ao carregar produção" message={error?.message || "Produção não encontrada"} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: productionEntity.name,
          headerBackTitle: "Voltar",
        }}
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
          {/* Modular Components */}
          <ProductionInfoCard production={production} />
          <PaintFormulaCard production={production} />
          <ComponentsUsedCard production={production} />

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
                entityType={CHANGE_LOG_ENTITY_TYPE.PAINT_PRODUCTION}
                entityId={production.id}
                entityName={productionEntity.name}
                entityCreatedAt={production.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>

          {/* Bottom spacing */}
          <View style={{ height: spacing.md }} />
        </View>
      </ScrollView>
    </>
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
});
