import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { usePaintBrand, usePaintBrandMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, PAINT_FINISH_LABELS, TRUCK_MANUFACTURER_LABELS, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { formatDate } from "@/utils";
import { DetailScreen } from "@/components/screens/detail-screen";
import {
  IconPaint,
  IconSettings,
  IconInfoCircle,
  IconBrush,
  IconCalendar,
  IconComponents,
  IconTag,
} from "@tabler/icons-react-native";
import { ComponentsTable } from "@/components/painting/paint-type/detail";

export default function PaintBrandDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = usePaintBrandMutations();

  const query = usePaintBrand(id as string, {
    include: {
      componentItems: {
        include: {
          measures: true,
          category: true,
          brands: true,
        },
      },
      paints: {
        orderBy: { name: "asc" },
        include: {
          paintType: true,
          formulas: true,
        },
      },
      _count: {
        select: {
          paints: true,
          componentItems: true,
        },
      },
    },
    enabled: !!id,
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconTag}
      title={(b: any) => b.name ?? "Marca de Tinta"}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={(b: any) => mobileRoute(routes.painting.paintBrands.edit(b.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja excluir esta marca de tinta? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.painting.paintBrands.root),
      }}
      notFoundFallback={mobileRoute(routes.painting.paintBrands.root)}
    >
      {(paintBrand: any) => <PaintBrandBody paintBrand={paintBrand} />}
    </DetailScreen>
  );
}

function PaintBrandBody({ paintBrand }: { paintBrand: any }) {
  const { colors } = useTheme();
  const nav = useNav();

  return (
    <View style={styles.body}>
      {/* Basic Information */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeftSection}>
            <IconInfoCircle size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Informações Básicas</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Nome</ThemedText>
            <ThemedText style={styles.detailValue}>{paintBrand.name}</ThemedText>
          </View>
        </View>
      </Card>

      {/* Statistics */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeftSection}>
            <IconSettings size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Estatísticas</ThemedText>
          </View>
        </View>
        <View style={styles.statisticsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
            <IconPaint size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{paintBrand._count?.paints || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Tintas</ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
            <IconComponents size={24} color={colors.primary} />
            <ThemedText style={styles.statValue}>{paintBrand._count?.componentItems || 0}</ThemedText>
            <ThemedText style={styles.statLabel}>Componentes</ThemedText>
          </View>
        </View>
      </Card>

      {/* Related Paints */}
      {paintBrand.paints && paintBrand.paints.length > 0 ? (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeftSection}>
              <IconBrush size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Tintas Relacionadas</ThemedText>
            </View>
          </View>
          <ScrollView style={{ maxHeight: 400 }} nestedScrollEnabled showsVerticalScrollIndicator>
            <View style={styles.paintsList}>
              {paintBrand.paints.map((paint: any) => (
                <TouchableOpacity
                  key={paint.id}
                  style={[styles.paintItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => nav.push(mobileRoute(routes.painting.catalog.details(paint.id)))}
                  activeOpacity={0.7}
                >
                  <View style={styles.paintItemLeft}>
                    <View
                      style={[
                        styles.colorPreview,
                        { backgroundColor: paint.hex || colors.muted, borderColor: colors.border },
                      ]}
                    />
                    <View style={styles.paintInfo}>
                      <ThemedText style={styles.paintName} numberOfLines={1}>
                        {paint.name}
                      </ThemedText>
                      <View style={styles.paintBadges}>
                        {paint.paintType?.name && (
                          <Badge variant="outline" size="sm">
                            {paint.paintType.name}
                          </Badge>
                        )}
                        {paint.finish && (
                          <Badge variant="secondary" size="sm">
                            {PAINT_FINISH_LABELS[paint.finish as keyof typeof PAINT_FINISH_LABELS] || paint.finish}
                          </Badge>
                        )}
                        {paint.manufacturer && (
                          <Badge variant="outline" size="sm">
                            {TRUCK_MANUFACTURER_LABELS[paint.manufacturer as keyof typeof TRUCK_MANUFACTURER_LABELS] || paint.manufacturer}
                          </Badge>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>
      ) : (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeftSection}>
              <IconBrush size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Tintas Relacionadas</ThemedText>
            </View>
          </View>
          <View style={styles.emptyState}>
            <IconPaint size={48} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
            <ThemedText style={styles.emptyStateText}>Nenhuma tinta cadastrada para esta marca</ThemedText>
          </View>
        </Card>
      )}

      {/* Components Table */}
      <ComponentsTable paintType={paintBrand as any} maxHeight={400} />

      {/* Metadata */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeftSection}>
            <IconCalendar size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Metadados</ThemedText>
          </View>
        </View>
        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Data de Criação</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(paintBrand.createdAt)}</ThemedText>
          </View>
          {paintBrand.updatedAt && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Última Atualização</ThemedText>
              <ThemedText style={styles.detailValue}>{formatDate(paintBrand.updatedAt)}</ThemedText>
            </View>
          )}
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
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
  },
  statisticsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
  },
  paintsList: {
    gap: spacing.sm,
  },
  paintItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  paintItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  paintInfo: {
    flex: 1,
  },
  paintName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  paintBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    textAlign: "center",
  },
});
