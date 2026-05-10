import React from "react";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { usePaintDetail, usePaintMutations } from "@/hooks";
import {
  PaintFormulasCard,
  PaintTasksCard,
  PaintRelatedPaintsCard,
  PaintSpecificationsCard,
  PaintGroundPaintsCard,
  PaintProductionHistoryCard,
} from "@/components/painting/catalog/detail";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { IconPaint } from "@tabler/icons-react-native";

export default function CatalogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteMutation } = usePaintMutations();

  const query = usePaintDetail(id as string, {
    include: {
      paintType: true,
      paintBrand: true,
      formulas: {
        include: {
          components: { include: { item: true } },
          paintProduction: true,
          paint: true,
        },
      },
      relatedPaints: true,
      relatedTo: true,
      paintGrounds: {
        include: {
          groundPaint: { include: { paintType: true, paintBrand: true } },
        },
      },
      generalPaintings: {
        select: {
          id: true,
          name: true,
          status: true,
          customer: { select: { id: true, fantasyName: true } },
          createdBy: { select: { id: true, name: true } },
          sector: { select: { id: true, name: true } },
          services: { select: { id: true, name: true } },
        },
      },
      logoTasks: {
        select: {
          id: true,
          name: true,
          status: true,
          customer: { select: { id: true, fantasyName: true } },
          createdBy: { select: { id: true, name: true } },
          sector: { select: { id: true, name: true } },
          services: { select: { id: true, name: true } },
        },
      },
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconPaint}
      title={(p: any) => p.name ?? "Tinta"}
      privilege={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
      editRoute={(p: any) => mobileRoute(routes.painting.catalog.edit(p.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja excluir esta tinta? Esta ação não pode ser desfeita.",
        successRoute: mobileRoute(routes.painting.catalog.root),
      }}
      notFoundFallback={mobileRoute(routes.painting.catalog.root)}
    >
      {(paint: any) => <PaintBody paint={paint} />}
    </DetailScreen>
  );
}

function PaintBody({ paint }: { paint: any }) {
  const { user } = useAuth();
  const userPrivilege = user?.sector?.privileges;

  // Only WAREHOUSE/ADMIN can see production history (full catalog only).
  const canSeeProductionHistory =
    userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN;

  // Formula navigation always allowed in full catalog (gated to WAREHOUSE/ADMIN).
  const canNavigateToFormulas = true;

  const metrics = calculatePaintMetrics(paint);

  return (
    <View style={styles.body}>
      <PaintSpecificationsCard paint={paint} />
      <PaintGroundPaintsCard paint={paint} />
      <PaintFormulasCard paint={paint} canNavigate={canNavigateToFormulas} />
      <PaintTasksCard paint={paint} maxHeight={500} />
      {canSeeProductionHistory && (
        <PaintProductionHistoryCard paint={paint} maxHeight={400} />
      )}
      <PaintRelatedPaintsCard paint={paint} />
      {metrics && metrics.measureDataCompleteness < 50 && (
        <Alert variant="default">
          <Icon name="info" size={16} />
          <AlertDescription>
            Esta tinta possui dados de medida incompletos. Para melhor precisão na produção,
            considere adicionar informações de peso e volume aos componentes das fórmulas.
          </AlertDescription>
        </Alert>
      )}
    </View>
  );
}

function calculatePaintMetrics(paint: any) {
  if (!paint?.formulas || paint.formulas.length === 0) return null;

  let totalComponents = 0;
  let formulasWithWeightData = 0;
  let formulasWithVolumeData = 0;

  paint.formulas.forEach((formula: any) => {
    if (formula.components) {
      totalComponents += formula.components.length;
      let hasWeight = false;
      let hasVolume = false;
      formula.components.forEach((component: any) => {
        if (component.ratio) hasWeight = true;
        if (component.ratio) hasVolume = true;
      });
      if (hasWeight) formulasWithWeightData++;
      if (hasVolume) formulasWithVolumeData++;
    }
  });

  return {
    totalFormulas: paint.formulas.length,
    totalComponents,
    measureDataCompleteness:
      paint.formulas.length > 0
        ? ((formulasWithWeightData + formulasWithVolumeData) / (paint.formulas.length * 2)) * 100
        : 0,
  };
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
