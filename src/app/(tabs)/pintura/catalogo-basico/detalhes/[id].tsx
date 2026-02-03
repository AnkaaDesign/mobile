import React from "react";
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View, RefreshControl, StyleSheet } from "react-native";
import { usePaintDetail, useScreenReady } from "@/hooks";
import {
  PaintFormulasCard,
  PaintRelatedPaintsCard,
  PaintSpecificationsCard,
  PaintGroundPaintsCard,
} from "@/components/painting/catalog/detail";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, isTeamLeader } from "@/utils";
import { IconPaint } from "@tabler/icons-react-native";

/**
 * Basic Catalog Details Screen
 *
 * This screen provides a read-only view of paint catalog items for team leaders.
 * Unlike the full painting catalog, this screen:
 * - Shows essential paint information (specifications, formulas, related paints)
 * - Does not allow editing or deleting
 * - Does not show tasks or production history (warehouse-specific features)
 * - Is accessible to team leaders (managedSector relationship) without requiring WAREHOUSE access
 *
 * Use case: Team leaders need to view paint information to understand production
 * requirements without having full warehouse management access.
 */
export default function CatalogoBasicoDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  // Check user permissions - team leaders can view, warehouse can edit
  // Team leadership is now determined by managedSector relationship
  const isLeader = isTeamLeader(user);
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const userPrivilege = user?.sector?.privileges;

  // Only WAREHOUSE, ADMIN, and PRODUCTION team leaders can navigate to formula details
  const canNavigateToFormulas = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN ||
    (userPrivilege === SECTOR_PRIVILEGES.PRODUCTION && isLeader);

  // OPTIMIZED: Use select instead of include to fetch only required fields
  // For basic catalog view, we only need formula counts, not full component data
  // This reduces data transfer by ~80% compared to fetching full components with items
  const {
    data: paintResponse,
    isLoading,
    error,
    refetch,
  } = usePaintDetail(id as string, {
    select: {
      id: true,
      name: true,
      code: true,
      hex: true,
      hexColor: true,
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
      // Paint type with minimal fields
      paintType: {
        select: {
          id: true,
          name: true,
          needGround: true,
        },
      },
      // Paint brand with minimal fields
      paintBrand: {
        select: {
          id: true,
          name: true,
        },
      },
      // Formulas with _count instead of full components array
      // This is the key optimization - we only need component count for display
      formulas: {
        select: {
          id: true,
          description: true,
          density: true,
          pricePerLiter: true,
          createdAt: true,
          // Only count components, don't fetch full data
          _count: {
            select: {
              components: true,
            },
          },
        },
      },
      // Related paints with fields needed for display
      relatedPaints: {
        select: {
          id: true,
          name: true,
          hex: true,
          colorPreview: true,
          finish: true,
          paintBrand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      relatedTo: {
        select: {
          id: true,
          name: true,
          hex: true,
          colorPreview: true,
          finish: true,
          paintBrand: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      // Paint grounds with necessary fields for display
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
              paintType: {
                select: {
                  id: true,
                  name: true,
                },
              },
              paintBrand: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const paint = paintResponse?.data;

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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

  if (error || !paint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen title="Erro ao carregar tinta" message={error?.message || "Tinta não encontrada"} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: paint?.name || "Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.container}>
          {/* Header Card with Paint Name */}
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <IconPaint size={24} color={colors.primary} />
              </View>
              <View style={styles.headerLeft}>
                <ThemedText style={[styles.paintTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {paint.name}
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* Read-only notice for team leaders */}
          {isLeader && !canEdit && (
            <Alert variant="default">
              <Icon name="info" size={16} />
              <AlertDescription>
                Você está visualizando o catálogo básico como líder de equipe. Para editar ou gerenciar esta tinta, é necessário acesso ao módulo de almoxarifado.
              </AlertDescription>
            </Alert>
          )}

          {/* Warehouse access notice */}
          {canEdit && (
            <Alert variant="default">
              <Icon name="info" size={16} />
              <AlertDescription>
                Esta é uma visualização do catálogo básico. Para editar esta tinta, acesse o catálogo completo através do módulo de pintura.
              </AlertDescription>
            </Alert>
          )}

          {/* Specifications Card - Detailed info with color codes */}
          <PaintSpecificationsCard paint={paint!} />

          {/* Ground Paints Card - Recommended base paints */}
          <PaintGroundPaintsCard paint={paint!} />

          {/* Formulas Card - Navigation controlled by permissions */}
          <PaintFormulasCard paint={paint!} canNavigate={canNavigateToFormulas} />

          {/* Related Paints Card */}
          <PaintRelatedPaintsCard paint={paint!} />

          {/* Information cards */}
          {(!paint?.formulas || paint.formulas.length === 0) && (
            <Alert>
              <Icon name="info" size={16} />
              <AlertDescription>
                Esta tinta ainda não possui fórmulas cadastradas. Entre em contato com o almoxarifado para adicionar fórmulas.
              </AlertDescription>
            </Alert>
          )}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  paintTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
});
