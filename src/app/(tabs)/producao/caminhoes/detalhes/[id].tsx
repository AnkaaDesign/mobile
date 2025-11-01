import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTruck, useTruckMutations } from "../../../../../hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES, CHANGE_LOG_ENTITY_TYPE } from "../../../../../constants";
import { hasPrivilege } from "../../../../../utils";
import { showToast } from "@/components/ui/toast";
import { TruckInfoCard } from "@/components/production/truck/detail/truck-info-card";
import { TruckTaskInfoCard } from "@/components/production/truck/detail/truck-task-info-card";
import { TruckLocationCard } from "@/components/production/truck/detail/truck-location-card";
import { TruckLayoutsCard } from "@/components/production/truck/detail/truck-layouts-card";
import { TruckMetadataCard } from "@/components/production/truck/detail/truck-metadata-card";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import {
  IconTruck,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconHistory,
} from "@tabler/icons-react-native";

export default function TruckDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useTruckMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Check if user is from Warehouse sector (should hide changelog)
  const isWarehouseSector = user?.sector?.privileges === SECTOR_PRIVILEGES.WAREHOUSE;

  // Fetch truck details
  const { data: response, isLoading, error, refetch } = useTruck(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      garage: true,
      leftSideLayout: {
        include: {
          layoutSections: true,
        },
      },
      rightSideLayout: {
        include: {
          layoutSections: true,
        },
      },
      backSideLayout: {
        include: {
          layoutSections: true,
        },
      },
    },
  });

  const truck = response?.data;

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
    router.push(`/producao/caminhoes/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Caminhão",
      "Tem certeza que deseja excluir este caminhão? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Caminhão excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir caminhão", type: "error" });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do caminhão..." />;
  }

  if (error || !truck) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do caminhão"
        onRetry={refetch}
      />
    );
  }

  const displayTitle = truck.task?.plate || truck.task?.name || `Caminhão ${truck.id.slice(0, 8)}`;

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
        {/* Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <IconTruck size={24} color={colors.primary} />
              <View style={styles.headerTextContainer}>
                <ThemedText style={StyleSheet.flatten([styles.truckTitle, { color: colors.foreground }])} numberOfLines={2}>
                  {displayTitle}
                </ThemedText>
                {truck.model && (
                  <ThemedText style={[styles.truckSubtitle, { color: colors.mutedForeground }]}>
                    {truck.model}
                  </ThemedText>
                )}
              </View>
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

        {/* Basic Information */}
        <TruckInfoCard truck={truck} />

        {/* Task/Service Order Information */}
        {truck.task && (
          <TruckTaskInfoCard
            task={{
              id: truck.task.id,
              name: truck.task.name,
              plate: truck.task.plate ?? undefined,
              serialNumber: truck.task.serialNumber ?? undefined,
              customer: truck.task.customer ? {
                fantasyName: truck.task.customer.fantasyName,
                corporateName: truck.task.customer.corporateName ?? undefined,
              } : undefined,
            }}
          />
        )}

        {/* Location Information */}
        <TruckLocationCard truck={truck} />

        {/* Layouts Information */}
        <TruckLayoutsCard
          layouts={{
            leftSideLayout: truck.leftSideLayout ? { ...truck.leftSideLayout, side: "LEFT" } : null,
            rightSideLayout: truck.rightSideLayout ? { ...truck.rightSideLayout, side: "RIGHT" } : null,
            backSideLayout: truck.backSideLayout ? { ...truck.backSideLayout, side: "BACK" } : null,
          }}
        />

        {/* Metadata */}
        <TruckMetadataCard truck={truck} />

        {/* Changelog History - Hidden for Warehouse sector users */}
        {!isWarehouseSector && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconHistory size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.TRUCK}
                entityId={truck.id}
                entityName={displayTitle}
                entityCreatedAt={truck.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>
        )}

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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  truckTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  truckSubtitle: {
    fontSize: fontSize.sm,
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
});
