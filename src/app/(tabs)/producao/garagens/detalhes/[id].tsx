import React, { useState, useMemo } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useGarage, useGarageMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { hasPrivilege, formatDateTime } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  IconBuilding,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconRuler2,
  IconMapPin,
  IconRoad,
  IconCar,
  IconHistory,
} from "@tabler/icons-react-native";

export default function GarageDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useGarageMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch garage details
  const { data: response, isLoading, error, refetch } = useGarage(id as string, {
    include: {
      lanes: {
        orderBy: { createdAt: "asc" },
      },
      trucks: {
        include: {
          task: {
            include: {
              customer: true,
            },
          },
        },
      },
    },
  });

  const garage = response?.data;

  // Calculate garage metrics
  const metrics = useMemo(() => {
    if (!garage) return null;

    const totalLanes = garage.lanes?.length || 0;
    const area = garage.width * garage.length;

    // Calculate average lane dimensions
    const avgLaneWidth = totalLanes > 0
      ? garage.lanes!.reduce((sum, lane) => sum + lane.width, 0) / totalLanes
      : 0;
    const avgLaneLength = totalLanes > 0
      ? garage.lanes!.reduce((sum, lane) => sum + lane.length, 0) / totalLanes
      : 0;

    // Calculate parking statistics
    const totalTrucks = garage.trucks?.length || 0;

    return {
      totalLanes,
      area,
      avgLaneWidth,
      avgLaneLength,
      totalTrucks,
    };
  }, [garage]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/producao/garagens/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Garagem",
      "Tem certeza que deseja excluir esta garagem? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Garagem excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir garagem", type: "error" });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da garagem..." />;
  }

  if (error || !garage) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da garagem"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Garage Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.garageTitle, { color: colors.foreground }])} numberOfLines={2}>
                {garage.name}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleRefresh}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.muted }])}
                activeOpacity={0.7}
                disabled={refreshing}
              >
                <IconRefresh size={18} color={colors.foreground} />
              </TouchableOpacity>
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Specifications Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconRuler2 size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Especificações</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Largura
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {garage.width.toFixed(2)} m
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Comprimento
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {garage.length.toFixed(2)} m
              </ThemedText>
            </View>
            <View style={StyleSheet.flatten([styles.detailRow, styles.detailRowBordered])}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Área Total
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground, fontWeight: fontWeight.semibold }])}>
                {metrics?.area.toFixed(2)} m²
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={StyleSheet.flatten([styles.detailLabel, { color: colors.mutedForeground }])}>
                Criada em
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.detailValue, { color: colors.foreground }])}>
                {formatDateTime(garage.createdAt)}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Capacity Metrics Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconMapPin size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Capacidade e Ocupação</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.primary }])}>
                  {metrics?.totalLanes}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                  Faixas
                </ThemedText>
              </View>
              <View style={styles.metricItem}>
                <ThemedText style={StyleSheet.flatten([styles.metricValue, { color: colors.primary }])}>
                  {metrics?.totalTrucks}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.metricLabel, { color: colors.mutedForeground }])}>
                  Caminhões
                </ThemedText>
              </View>
            </View>

            {metrics && metrics.totalLanes > 0 && (
              <View style={styles.avgDimensionsSection}>
                <ThemedText style={StyleSheet.flatten([styles.avgDimensionsTitle, { color: colors.mutedForeground }])}>
                  Dimensões Médias das Faixas
                </ThemedText>
                <View style={styles.avgDimensionsGrid}>
                  <View style={styles.avgDimensionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.avgDimensionValue, { color: colors.foreground }])}>
                      {metrics.avgLaneWidth.toFixed(1)} m
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.avgDimensionLabel, { color: colors.mutedForeground }])}>
                      Largura
                    </ThemedText>
                  </View>
                  <View style={styles.avgDimensionItem}>
                    <ThemedText style={StyleSheet.flatten([styles.avgDimensionValue, { color: colors.foreground }])}>
                      {metrics.avgLaneLength.toFixed(1)} m
                    </ThemedText>
                    <ThemedText style={StyleSheet.flatten([styles.avgDimensionLabel, { color: colors.mutedForeground }])}>
                      Comprimento
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Lanes Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconRoad size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Faixas de Estacionamento</ThemedText>
            {garage.lanes && garage.lanes.length > 0 && (
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {garage.lanes.length}
              </Badge>
            )}
          </View>
          {garage.lanes && garage.lanes.length > 0 ? (
            <View style={styles.lanesList}>
              {garage.lanes.map((lane, index) => (
                <TouchableOpacity
                  key={lane.id}
                  style={StyleSheet.flatten([
                    styles.laneItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }
                  ])}
                  onPress={() => {
                    // Navigate to lane details if needed
                    // router.push(`/production/garages/lanes/details/${lane.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.laneHeader}>
                    <ThemedText style={StyleSheet.flatten([styles.laneName, { color: colors.foreground }])}>
                      Faixa {index + 1}
                    </ThemedText>
                    <IconRoad size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={styles.laneDetails}>
                    <View style={styles.laneDetailRow}>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailLabel, { color: colors.mutedForeground }])}>
                        Dimensões:
                      </ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailValue, { color: colors.foreground }])}>
                        {lane.width}×{lane.length}m
                      </ThemedText>
                    </View>
                    <View style={styles.laneDetailRow}>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailLabel, { color: colors.mutedForeground }])}>
                        Área:
                      </ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailValue, { color: colors.foreground }])}>
                        {(lane.width * lane.length).toFixed(1)}m²
                      </ThemedText>
                    </View>
                    <View style={styles.laneDetailRow}>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailLabel, { color: colors.mutedForeground }])}>
                        Posição:
                      </ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.laneDetailValue, { color: colors.foreground }])}>
                        ({lane.xPosition}, {lane.yPosition})
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={StyleSheet.flatten([styles.emptyStateText, { color: colors.mutedForeground }])}>
                Nenhuma faixa cadastrada nesta garagem
              </ThemedText>
            </View>
          )}
        </Card>

        {/* Trucks Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconCar size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Caminhões na Garagem</ThemedText>
            {garage.trucks && garage.trucks.length > 0 && (
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {garage.trucks.length}
              </Badge>
            )}
          </View>
          {garage.trucks && garage.trucks.length > 0 ? (
            <View style={styles.trucksList}>
              {garage.trucks.map((truck) => (
                <TouchableOpacity
                  key={truck.id}
                  style={StyleSheet.flatten([
                    styles.truckItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    }
                  ])}
                  onPress={() => {
                    router.push(`/producao/caminhoes/detalhes/${truck.id}`);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.truckHeader}>
                    <ThemedText style={StyleSheet.flatten([styles.truckPlate, { color: colors.foreground }])}>
                      {truck.plate}
                    </ThemedText>
                    <IconCar size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={styles.truckDetails}>
                    {truck.task && (
                      <>
                        <View style={styles.truckDetailRow}>
                          <ThemedText style={StyleSheet.flatten([styles.truckDetailLabel, { color: colors.mutedForeground }])}>
                            OS:
                          </ThemedText>
                          <ThemedText style={StyleSheet.flatten([styles.truckDetailValue, { color: colors.foreground }])}>
                            {truck.task.serialNumber}
                          </ThemedText>
                        </View>
                        {truck.task.customer && (
                          <View style={styles.truckDetailRow}>
                            <ThemedText style={StyleSheet.flatten([styles.truckDetailLabel, { color: colors.mutedForeground }])}>
                              Cliente:
                            </ThemedText>
                            <ThemedText
                              style={StyleSheet.flatten([styles.truckDetailValue, { color: colors.foreground }])}
                              numberOfLines={1}
                            >
                              {truck.task.customer.fantasyName || truck.task.customer.corporateName}
                            </ThemedText>
                          </View>
                        )}
                      </>
                    )}
                    <View style={styles.truckDetailRow}>
                      <ThemedText style={StyleSheet.flatten([styles.truckDetailLabel, { color: colors.mutedForeground }])}>
                        Entrada:
                      </ThemedText>
                      <ThemedText style={StyleSheet.flatten([styles.truckDetailValue, { color: colors.foreground }])}>
                        {formatDateTime(truck.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText style={StyleSheet.flatten([styles.emptyStateText, { color: colors.mutedForeground }])}>
                Nenhum caminhão na garagem no momento
              </ThemedText>
            </View>
          )}
        </Card>

        {/* Changelog History */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconHistory size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <View style={{ paddingHorizontal: spacing.md }}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.GARAGE}
              entityId={garage.id}
              entityName={garage.name}
              entityCreatedAt={garage.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  garageTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  detailRowBordered: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    width: 120,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    flex: 1,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "transparent",
  },
  metricValue: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  metricLabel: {
    fontSize: fontSize.sm,
  },
  avgDimensionsSection: {
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  avgDimensionsTitle: {
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  avgDimensionsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  avgDimensionItem: {
    flex: 1,
  },
  avgDimensionValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  avgDimensionLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  lanesList: {
    gap: spacing.md,
  },
  laneItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  laneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  laneName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  laneDetails: {
    gap: spacing.xs,
  },
  laneDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  laneDetailLabel: {
    fontSize: fontSize.sm,
  },
  laneDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  trucksList: {
    gap: spacing.md,
  },
  truckItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  truckHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  truckPlate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  truckDetails: {
    gap: spacing.xs,
  },
  truckDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  truckDetailLabel: {
    fontSize: fontSize.sm,
  },
  truckDetailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
    textAlign: "right",
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
