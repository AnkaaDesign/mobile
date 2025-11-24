import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useObservationDetail, useObservationMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { TouchableOpacity } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import {
  ObservationInfoCard,
  ObservationFilesCard,
  
  ObservationMetadataCard,
} from "@/components/production/observation/detail";

export default function ObservationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const { delete: deleteAsync } = useObservationMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch observation details
  const { data: response, isLoading, error, refetch } = useObservationDetail(id as string, {
    include: {
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      files: true,
      commissions: {
        include: {
          user: true,
        },
      },
    },
  });

  const observation = response?.data;

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
    router.push(`/producao/observacoes/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    // Fixed: commissions property no longer exists on Observation type
    const warningMessage = "Tem certeza que deseja excluir esta observação? Esta ação não pode ser desfeita.";

    Alert.alert(
      "Excluir Observação",
      warningMessage,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Observação excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir observação", type: "error" });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da observação..." />;
  }

  if (error || !observation) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da observação"
        onRetry={refetch}
      />
    );
  }

  // Generate page title
  const pageTitle = observation.task
    ? `Observação - ${observation.task.name}`
    : `Observação`;

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
        {/* Page Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText
                style={StyleSheet.flatten([styles.pageTitle, { color: colors.foreground }])}
                numberOfLines={2}
              >
                {pageTitle}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
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
          </View>
        </Card>

        {/* Observation Information Card */}
        <ObservationInfoCard observation={observation as any} />

        {/* Files Card */}
        {observation.files && observation.files.length > 0 && (
          <ObservationFilesCard files={observation.files as any} />
        )}

        {/* Commissions Card - Removed: commissions no longer exist on Observation type */}

        {/* Metadata Card */}
        <ObservationMetadataCard
          createdAt={observation.createdAt}
          updatedAt={observation.updatedAt}
        />

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
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pageTitle: {
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
