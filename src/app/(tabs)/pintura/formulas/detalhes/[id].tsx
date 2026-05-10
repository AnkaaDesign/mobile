import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { usePaintFormula, usePaintFormulaMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { formatDateTime } from "@/utils";
import { DetailScreen } from "@/components/screens/detail-screen";
import { MobilePaintFormulaCalculator } from "@/components/painting/formula/mobile-paint-formula-calculator";
import { IconBuildingFactory, IconFlask } from "@tabler/icons-react-native";

export default function FormulaDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = usePaintFormulaMutations();

  const query = usePaintFormula(id as string, {
    include: {
      paint: {
        include: {
          paintType: true,
          paintBrand: true,
          color: true,
        },
      },
      components: {
        include: {
          item: {
            include: {
              brand: true,
              category: true,
              supplier: true,
            },
          },
        },
        orderBy: {
          ratio: "desc",
        },
      },
      paintProduction: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          components: true,
          paintProduction: true,
        },
      },
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconFlask}
      title={(f: any) => f?.paint?.name ? `Fórmula de ${f.paint.name}` : "Fórmula"}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={(f: any) => mobileRoute(routes.painting.formulas.edit(f.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja excluir esta fórmula? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.painting.formulas.root),
      }}
      notFoundFallback={mobileRoute(routes.painting.formulas.root)}
    >
      {(formula: any) => <FormulaBody formula={formula} />}
    </DetailScreen>
  );
}

function FormulaBody({ formula }: { formula: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userPrivilege = user?.sector?.privileges;

  // Only COMMERCIAL, ADMIN, FINANCIAL can see prices (WAREHOUSE excluded).
  const canSeePrices =
    userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;

  return (
    <View style={styles.body}>
      {/* Production Calculator */}
      {formula.components && formula.components.length > 0 && (
        <MobilePaintFormulaCalculator formula={formula} allowPriceVisibility={canSeePrices} />
      )}

      {/* Productions Summary Card */}
      {formula._count?.paintProduction !== undefined && formula._count.paintProduction > 0 && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBuildingFactory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Produção</ThemedText>
            </View>
            <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
              {formula._count.paintProduction}
            </Badge>
          </View>
          <View style={styles.itemDetails}>
            <ThemedText style={[styles.detailValue, { color: colors.mutedForeground }]}>
              Esta fórmula foi utilizada em {formula._count.paintProduction}{" "}
              {formula._count.paintProduction === 1 ? "produção" : "produções"}.
            </ThemedText>
            {formula.paintProduction && formula.paintProduction.length > 0 && (
              <View style={styles.productionsList}>
                {formula.paintProduction.slice(0, 3).map((production: any) => (
                  <View
                    key={production.id}
                    style={[styles.productionItem, { backgroundColor: colors.muted + "30" }]}
                  >
                    <Badge variant="outline">
                      <ThemedText style={styles.productionVolume}>
                        {production.volumeLiters?.toFixed(2)} L
                      </ThemedText>
                    </Badge>
                    <ThemedText style={[styles.productionDate, { color: colors.mutedForeground }]}>
                      {formatDateTime(production.createdAt)}
                    </ThemedText>
                  </View>
                ))}
                {formula._count.paintProduction > 3 && (
                  <ThemedText style={[styles.moreProductions, { color: colors.primary }]}>
                    + {formula._count.paintProduction - 3} mais produções
                  </ThemedText>
                )}
              </View>
            )}
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
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
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  productionsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  productionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  productionVolume: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  productionDate: {
    fontSize: fontSize.xs,
  },
  moreProductions: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
