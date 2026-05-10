import React from "react";
import { useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";
import { usePaintDetail } from "@/hooks";
import {
  PaintFormulasCard,
  PaintRelatedPaintsCard,
  PaintSpecificationsCard,
  PaintGroundPaintsCard,
} from "@/components/painting/catalog/detail";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { spacing } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, routes } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { hasPrivilege, isTeamLeader } from "@/utils";
import { DetailScreen } from "@/components/screens/detail-screen";
import { IconPaint } from "@tabler/icons-react-native";

/**
 * Basic Catalog Details Screen
 *
 * Read-only view of paint catalog items for team leaders.
 * Unlike the full painting catalog, this screen:
 * - Shows essential paint information (specifications, formulas, related paints)
 * - Does not allow editing or deleting
 * - Does not show tasks or production history (warehouse-specific features)
 * - Is accessible to team leaders without requiring WAREHOUSE access
 */
export default function CatalogoBasicoDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const query = usePaintDetail(id as string, {
    select: {
      id: true,
      name: true,
      code: true,
      hex: true,

      finish: true,
      colorPreview: true,
      description: true,
      colorOrder: true,
      manufacturer: true,
      tags: true,
      paintTypeId: true,
      paintBrandId: true,
      createdAt: true,
      updatedAt: true,
      paintType: { select: { id: true, name: true, needGround: true } },
      paintBrand: { select: { id: true, name: true } },
      formulas: {
        select: {
          id: true,
          description: true,
          density: true,
          pricePerLiter: true,
          createdAt: true,
          components: { select: { id: true } },
        },
      },
      relatedPaints: {
        select: {
          id: true,
          name: true,
          hex: true,
          colorPreview: true,
          finish: true,
          paintBrand: { select: { id: true, name: true } },
        },
      },
      relatedTo: {
        select: {
          id: true,
          name: true,
          hex: true,
          colorPreview: true,
          finish: true,
          paintBrand: { select: { id: true, name: true } },
        },
      },
      paintGrounds: {
        select: {
          id: true,
          groundPaint: {
            select: {
              id: true,
              name: true,
              code: true,
              hex: true,
              colorPreview: true,
              paintType: { select: { id: true, name: true } },
              paintBrand: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconPaint}
      title={(p: any) => p.name ?? "Tinta"}
      notFoundFallback={mobileRoute(routes.painting.basicCatalog.root)}
    >
      {(paint: any) => <BasicCatalogBody paint={paint} />}
    </DetailScreen>
  );
}

function BasicCatalogBody({ paint }: { paint: any }) {
  const { user } = useAuth();
  const isLeader = isTeamLeader(user);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const userPrivilege = user?.sector?.privileges;

  // Only WAREHOUSE, ADMIN, and PRODUCTION team leaders can navigate to formula details
  const canNavigateToFormulas =
    userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    (userPrivilege === SECTOR_PRIVILEGES.PRODUCTION && isLeader);

  return (
    <View style={styles.body}>
      {isLeader && !canEdit && (
        <Alert variant="default">
          <Icon name="info" size={16} />
          <AlertDescription>
            Você está visualizando o catálogo básico como líder de equipe. Para editar ou
            gerenciar esta tinta, é necessário acesso ao módulo de almoxarifado.
          </AlertDescription>
        </Alert>
      )}

      {canEdit && (
        <Alert variant="default">
          <Icon name="info" size={16} />
          <AlertDescription>
            Esta é uma visualização do catálogo básico. Para editar esta tinta, acesse o
            catálogo completo através do módulo de pintura.
          </AlertDescription>
        </Alert>
      )}

      <PaintSpecificationsCard paint={paint} />
      <PaintGroundPaintsCard paint={paint} />
      <PaintFormulasCard paint={paint} canNavigate={canNavigateToFormulas} />
      <PaintRelatedPaintsCard paint={paint} />

      {(!paint?.formulas || paint.formulas.length === 0) && (
        <Alert>
          <Icon name="info" size={16} />
          <AlertDescription>
            Esta tinta ainda não possui fórmulas cadastradas. Entre em contato com o
            almoxarifado para adicionar fórmulas.
          </AlertDescription>
        </Alert>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
