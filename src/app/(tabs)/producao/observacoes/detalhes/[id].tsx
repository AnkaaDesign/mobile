import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useObservationDetail, useObservationMutations, useScreenReady} from '@/hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege } from "@/utils";
// import { showToast } from "@/components/ui/toast";
import { TouchableOpacity } from "react-native";
import { IconEdit, IconTrash } from "@tabler/icons-react-native";
import {
  ObservationInfoCard,
  ObservationFilesCard,
} from "@/components/production/observation/detail";


import { Skeleton } from "@/components/ui/skeleton";

export default function ObservationDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useObservationMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions - only ADMIN, COMMERCIAL, and LOGISTIC can edit observations
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.COMMERCIAL) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.LOGISTIC);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch observation details
  const { data: response, isLoading, error, refetch } = useObservationDetail(id as string, {
    include: {
      task: {
        select: {
          id: true,
          name: true,
          customer: {
            select: {
              id: true,
              fantasyName: true,
            },
          },
          sector: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      files: true,
      commissions: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  useScreenReady(!isLoading);

  const observation = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    Alert.alert("Sucesso", "Detalhes atualizados");
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar");
      return;
    }
    router.push(`/producao/observacoes/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Erro", "Você não tem permissão para excluir");
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
              // API client already shows success alert
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: spacing.md, gap: spacing.md }}>
          {/* Header card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="70%" height={22} />
          </View>
          {/* Info card skeleton - task name, customer, description */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="40%" height={18} style={{ marginBottom: spacing.md }} />
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Skeleton width="35%" height={14} />
                <Skeleton width="45%" height={14} />
              </View>
            ))}
            <Skeleton width="100%" height={60} borderRadius={8} style={{ marginTop: spacing.sm }} />
          </View>
          {/* Files card skeleton */}
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Skeleton width="30%" height={18} style={{ marginBottom: spacing.md }} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Skeleton width={80} height={80} borderRadius={8} />
              <Skeleton width={80} height={80} borderRadius={8} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
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
