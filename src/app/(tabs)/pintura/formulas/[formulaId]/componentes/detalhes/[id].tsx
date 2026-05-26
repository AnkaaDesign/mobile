import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { usePaintFormulaComponent, usePaintFormulaComponentMutations, useCanViewPrices } from "@/hooks";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { formatDateTime, formatCurrency } from "@/utils";
import { DetailScreen } from "@/components/screens/detail-screen";
import {
  IconFlask,
  IconBarcode,
  IconPercentage,
  IconPackage,
  IconTag,
  IconCalendar,
  IconBuildingFactory,
} from "@tabler/icons-react-native";

export default function ComponentDetailsScreen() {
  const { formulaId, id } = useLocalSearchParams<{ formulaId: string; id: string }>();
  const { deleteMutation } = usePaintFormulaComponentMutations();

  const query = usePaintFormulaComponent(id!, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
          price: true,
        },
      },
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconFlask}
      title={(c: any) => c?.item?.name ?? "Componente"}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={() =>
        mobileRoute(`/pintura/formulas/${formulaId}/componentes/editar/${id}`)
      }
      deleteAction={{
        mutation: deleteMutation,
        confirmText:
          "Tem certeza que deseja remover este componente da fórmula? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.painting.formulas.details(formulaId!)),
      }}
      notFoundFallback={mobileRoute(routes.painting.formulas.details(formulaId!))}
    >
      {(component: any) => <ComponentBody component={component} />}
    </DetailScreen>
  );
}

function ComponentBody({ component }: { component: any }) {
  const { colors } = useTheme();
  const canViewPrices = useCanViewPrices();
  return (
    <View style={styles.body}>
      {/* Ratio Card */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPercentage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Proporção na Fórmula</ThemedText>
          </View>
        </View>
        <View style={styles.ratioDisplay}>
          <ThemedText style={styles.ratioValue}>{component.ratio.toFixed(2)}%</ThemedText>
          <ThemedText style={styles.ratioLabel}>do total da fórmula</ThemedText>
        </View>
      </Card>

      {/* Item Information */}
      {component.item && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconPackage size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Informações do Item</ThemedText>
            </View>
          </View>

          <View style={styles.itemInfo}>
            <ThemedText style={styles.itemName}>{component.item.name}</ThemedText>

            {component.item.uniCode && (
              <View style={styles.infoRow}>
                <IconBarcode size={16} color={colors.muted} />
                <ThemedText style={styles.infoLabel}>Código:</ThemedText>
                <ThemedText style={styles.infoValue}>{component.item.uniCode}</ThemedText>
              </View>
            )}

            {component.item.category?.description && (
              <View style={styles.descriptionContainer}>
                <ThemedText style={styles.description}>
                  {component.item.category.description}
                </ThemedText>
              </View>
            )}

            <View style={styles.badgeContainer}>
              {component.item.brand && (
                <Badge variant="outline" style={styles.brandBadge}>
                  <IconBuildingFactory size={14} color={colors.foreground} />
                  <ThemedText style={styles.badgeText}>{component.item.brand.name}</ThemedText>
                </Badge>
              )}

              {component.item.category && (
                <Badge variant="outline" style={styles.categoryBadge}>
                  <IconTag size={14} color={colors.foreground} />
                  <ThemedText style={styles.badgeText}>{component.item.category.name}</ThemedText>
                </Badge>
              )}
            </View>
          </View>
        </Card>
      )}

      {/* Formula Information */}
      {component.formula && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconFlask size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Fórmula</ThemedText>
            </View>
          </View>

          <View style={styles.formulaInfo}>
            {component.formula.paint && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Tinta:</ThemedText>
                <ThemedText style={styles.infoValue}>{component.formula.paint.name}</ThemedText>
              </View>
            )}

            {component.formula.description && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Descrição:</ThemedText>
                <ThemedText style={styles.infoValue}>{component.formula.description}</ThemedText>
              </View>
            )}

            {component.formula.density && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Densidade:</ThemedText>
                <ThemedText style={styles.infoValue}>{component.formula.density} g/mL</ThemedText>
              </View>
            )}

            {canViewPrices && component.formula.pricePerLiter && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Preço por Litro:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {formatCurrency(component.formula.pricePerLiter)}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Audit */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconCalendar size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações de Auditoria</ThemedText>
          </View>
        </View>

        <View style={styles.auditInfo}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDateTime(component.createdAt)}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Última atualização:</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDateTime(component.updatedAt)}</ThemedText>
          </View>
        </View>
      </Card>
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
  ratioDisplay: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  ratioValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  ratioLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  itemInfo: {
    gap: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    opacity: 0.8,
    lineHeight: 20,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  formulaInfo: {
    gap: spacing.sm,
  },
  auditInfo: {
    gap: spacing.sm,
  },
});
