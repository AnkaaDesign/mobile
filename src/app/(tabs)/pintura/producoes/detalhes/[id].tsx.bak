import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, StyleSheet, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { usePaintProductionDetail } from "@/hooks";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { IconHistory } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { ProductionInfoCard, PaintFormulaCard, ComponentsUsedCard } from "@/components/painting/production/detail";
import { showToast } from "@/components/ui/toast";

export default function ProductionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

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
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
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
        <LoadingScreen />
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
