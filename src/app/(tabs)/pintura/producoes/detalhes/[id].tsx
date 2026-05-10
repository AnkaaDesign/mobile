import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { usePaintProductionDetail, usePaintProductionMutations } from "@/hooks";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconHistory, IconBuildingFactory } from "@tabler/icons-react-native";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  ProductionInfoCard,
  PaintFormulaCard,
  ComponentsUsedCard,
} from "@/components/painting/production/detail";
import { DetailScreen } from "@/components/screens/detail-screen";

export default function ProductionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = usePaintProductionMutations();

  const query = usePaintProductionDetail(id as string, {
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

  return (
    <DetailScreen
      query={query as any}
      icon={IconBuildingFactory}
      title={(p: any) => {
        const paint = p?.formula?.paint;
        return paint ? `Produção de ${paint.name}` : `Produção ${String(p?.id ?? "").slice(0, 8)}`;
      }}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta produção? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.painting.productions.root),
      }}
      notFoundFallback={mobileRoute(routes.painting.productions.root)}
    >
      {(production: any) => <ProductionBody production={production} />}
    </DetailScreen>
  );
}

function ProductionBody({ production }: { production: any }) {
  const { colors } = useTheme();
  const paint = production?.formula?.paint;
  const productionEntityName = paint
    ? `Produção de ${paint.name}`
    : `Produção ${String(production?.id ?? "").slice(0, 8)}`;

  return (
    <View style={styles.body}>
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
            entityName={productionEntityName}
            entityCreatedAt={production.createdAt}
            maxHeight={400}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
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
