import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSector, useSectorMutations } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconHistory,
} from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { TouchableOpacity } from "react-native";
import { showToast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { hasPrivilege } from "../../../../../utils";
import { useAuth } from "@/contexts/auth-context";

// Import modular components
import { SpecificationsCard, SectorUsersCard, SectorTasksCard } from "@/components/administration/sector/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function SectorDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useSectorMutations();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useSector(id, {
    include: {
      users: {
        include: {
          position: true,
          sector: true,
          managedSector: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      managedByUsers: true,
      changelogs: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          users: true,
          tasks: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const sector = response?.data;

  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    if (sector) {
      router.push(routeToMobilePath(routes.administration.sectors.edit(sector.id)) as any);
    }
  };

  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    const userCount = sector?._count?.users || 0;
    const warningMessage = userCount > 0
      ? `\n\nAtenção: Este setor possui ${userCount} usuário${userCount !== 1 ? "s" : ""} associado${userCount !== 1 ? "s" : ""}.`
      : "";

    Alert.alert(
      "Excluir Setor",
      `Tem certeza que deseja excluir o setor "${sector?.name}"?${warningMessage}\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id);
              showToast({ message: "Setor excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir setor", type: "error" });
            }
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  }, [refetch]);

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do setor..." />;
  }

  if (error || !sector || !id || id === "") {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do setor"
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
        {/* Sector Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.sectorTitle, { color: colors.foreground }])} numberOfLines={2}>
                {sector.name}
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

        {/* Info Grid - Specifications and Changelog side by side on larger screens */}
        <View style={styles.infoGrid}>
          <SpecificationsCard sector={sector} />
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconHistory size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
            </View>
            <View style={{ paddingHorizontal: spacing.md }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.SECTOR}
                entityId={sector.id}
                entityName={sector.name}
                entityCreatedAt={sector.createdAt}
                maxHeight={400}
              />
            </View>
          </Card>
        </View>

        {/* Related Tasks */}
        <SectorTasksCard sector={sector} />

        {/* Related Users - Last Section */}
        <SectorUsersCard sector={sector} />

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
  sectorTitle: {
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
  infoGrid: {
    gap: spacing.lg,
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
