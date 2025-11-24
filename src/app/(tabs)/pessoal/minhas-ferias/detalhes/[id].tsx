import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useVacation, useVacationMutations } from "@/hooks";
import { VACATION_STATUS } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconBeach, IconTrash, IconX } from "@tabler/icons-react-native";
import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { canCancelVacation } from "@/utils";

// Import modular components
import {
  VacationCard,
  VacationDatesCard,
  VacationStatusCard,
  VacationTimelineCard,
} from "@/components/personal/vacation/detail";
import { VacationDetailSkeleton } from "@/components/personal/vacation/skeleton/vacation-detail-skeleton";

export default function MyVacationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data: user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useVacation(id, {
    include: {
      user: true,
    },
    enabled: !!id && id !== "",
  });

  const vacation = response?.data;

  // Vacation mutations
  const { updateAsync, deleteAsync, updateMutation, deleteMutation } = useVacationMutations();

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  const handleCancel = async () => {
    if (!vacation) return;

    Alert.alert(
      "Cancelar Férias",
      "Tem certeza que deseja cancelar esta solicitação de férias?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              await updateAsync({
                id: vacation.id,
                data: {
                  status: VACATION_STATUS.CANCELLED,
                },
              });

              showToast({
                message: "Férias canceladas com sucesso",
                type: "success",
              });

              refetch();
            } catch (error: any) {
              showToast({
                message: error?.message || "Não foi possível cancelar as férias",
                type: "error",
              });
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!vacation) return;

    Alert.alert(
      "Excluir Férias",
      "Tem certeza que deseja excluir esta solicitação de férias? Esta ação não pode ser desfeita.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim, Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(vacation.id);

              showToast({
                message: "Férias excluídas com sucesso",
                type: "success",
              });

              router.back();
            } catch (error: any) {
              showToast({
                message: error?.message || "Não foi possível excluir as férias",
                type: "error",
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <VacationDetailSkeleton />
        </View>
      </View>
    );
  }

  if (error || !vacation || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconBeach size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Férias não encontradas
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                As férias solicitadas não foram encontradas ou podem ter sido removidas.
              </ThemedText>
              <Button onPress={() => router.back()}>
                <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
              </Button>
            </View>
          </Card>
        </View>
      </View>
    );
  }

  const isOwnVacation = vacation.userId === user?.id;
  const canCancel = isOwnVacation && canCancelVacation(vacation);
  const canDelete = isOwnVacation && vacation.status === VACATION_STATUS.PENDING;

  // Format vacation name for timeline
  const vacationName = `Férias de ${vacation.user?.name || 'Colaborador'}`;

  return (
    <ScrollView
      style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Vacation Name Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconBeach size={24} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.vacationName, { color: colors.foreground }])}>
                Minhas Férias
              </ThemedText>
            </View>
            {(canCancel || canDelete) && (
              <View style={styles.headerActions}>
                {canCancel && (
                  <TouchableOpacity
                    onPress={handleCancel}
                    style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                    activeOpacity={0.7}
                    disabled={updateMutation.isPending}
                  >
                    <IconX size={18} color={colors.destructiveForeground} />
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                    activeOpacity={0.7}
                    disabled={deleteMutation.isPending}
                  >
                    <IconTrash size={18} color={colors.destructiveForeground} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>

        {/* Modular Components */}
        <VacationCard vacation={vacation} />
        <VacationDatesCard vacation={vacation} />
        <VacationStatusCard vacation={vacation} />

        {/* Collective Vacation Info */}
        {vacation.isCollective && (
          <Card style={styles.card}>
            <View style={StyleSheet.flatten([styles.infoBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
              <ThemedText style={StyleSheet.flatten([styles.infoText, { color: colors.foreground }])}>
                Esta é uma férias coletiva que se aplica a todos os funcionários. Você não pode cancelar ou excluir férias coletivas.
              </ThemedText>
            </View>
          </Card>
        )}

        {/* Changelog Timeline */}
        <VacationTimelineCard
          vacationId={vacation.id}
          vacationName={vacationName}
          vacationCreatedAt={vacation.createdAt}
          maxHeight={400}
        />

        {/* Bottom spacing */}
        <View style={{ height: spacing.md }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
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
  vacationName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
  },
});
