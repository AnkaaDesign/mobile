import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { usePosition, usePositionMutations } from "@/hooks/usePosition";
import { routes, CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES } from "@/constants";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconRefresh, IconEdit, IconTrash } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";
import { hasPrivilege } from "@/utils";

// Import modular components
import { SpecificationsCard, RemunerationHistoryCard, RelatedUsersCard } from "@/components/human-resources/position/detail";

import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function PositionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { delete: deleteAsync } = usePositionMutations();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.HUMAN_RESOURCES);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePosition(id, {
    include: {
      users: {
        include: {
          sector: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      remunerations: {
        orderBy: {
          createdAt: "desc",
        },
      },
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
          remunerations: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const position = response?.data;

  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    if (position) {
      router.push(routeToMobilePath(routes.humanResources.positions.edit(position.id)) as any);
    }
  };

  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    const employeeCount = position?._count?.users || 0;
    const warningMessage = employeeCount > 0
      ? `Este cargo possui ${employeeCount} colaborador${employeeCount !== 1 ? 'es' : ''} associado${employeeCount !== 1 ? 's' : ''}.\n\nTem certeza que deseja excluir? Esta ação não pode ser desfeita.`
      : "Tem certeza que deseja excluir este cargo? Esta ação não pode ser desfeita.";

    Alert.alert(
      "Excluir Cargo",
      warningMessage,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Cargo excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir cargo", type: "error" });
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
    return <LoadingScreen message="Carregando detalhes do cargo..." />;
  }

  if (error || !position || !id || id === "") {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do cargo"
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
        {/* Position Name Header Card */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.positionTitle, { color: colors.foreground }])} numberOfLines={2}>
                {position.name}
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

        {/* Info Grid - Specifications and Remuneration History */}
        <SpecificationsCard position={position} />
        <RemunerationHistoryCard position={position} />

        {/* Changelog - Single column */}
        <ChangelogTimeline
          entityType={CHANGE_LOG_ENTITY_TYPE.POSITION}
          entityId={id}
          entityName={position.name}
          entityCreatedAt={position.createdAt}
          maxHeight={500}
        />

        {/* Related Users - Full width, last section */}
        <RelatedUsersCard position={position} />

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
  positionTitle: {
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
});
