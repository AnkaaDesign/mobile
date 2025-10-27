import React from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { IconArrowLeft, IconTrash } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { useVacation, useVacationMutations } from '../../../../../hooks';
import { VacationCard } from "@/components/human-resources/vacation/detail/vacation-card";
import { canCancelVacation } from '../../../../../utils';
import { VACATION_STATUS } from '../../../../../constants';

export default function MyVacationDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = Array.isArray(id) ? id[0] : id;

  // Fetch vacation details
  const { data: vacationData, isLoading, error, refetch } = useVacation(vacationId, {
    include: {
      user: true,
    },
  });

  // Vacation mutations
  const { update, delete: deleteVacation } = useVacationMutations();

  const vacation = vacationData?.data;

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
              await update.mutateAsync({
                id: vacation.id,
                data: {
                  status: VACATION_STATUS.CANCELLED,
                },
              });

              Alert.alert(
                "Férias Canceladas",
                "Sua solicitação de férias foi cancelada com sucesso.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível cancelar as férias. Tente novamente.",
                [{ text: "OK" }]
              );
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
              await deleteVacation.mutateAsync(vacation.id);

              Alert.alert(
                "Férias Excluídas",
                "Sua solicitação de férias foi excluída com sucesso.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                "Erro",
                error?.message || "Não foi possível excluir as férias. Tente novamente.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !vacation) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes das férias"
        detail={error?.message || "Férias não encontradas"}
        onRetry={refetch}
      />
    );
  }

  const isOwnVacation = vacation.userId === user?.id;
  const canCancel = isOwnVacation && canCancelVacation(vacation);
  const canDelete = isOwnVacation && vacation.status === VACATION_STATUS.PENDING;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button variant="ghost" size="sm" onPress={() => router.back()} style={styles.backButton}>
          <IconArrowLeft size={20} color={colors.foreground} />
          <ThemedText>Voltar</ThemedText>
        </Button>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <VacationCard vacation={vacation} />

        {/* Actions */}
        {(canCancel || canDelete) && (
          <View style={styles.actionsContainer}>
            {canCancel && (
              <Button
                variant="outline"
                onPress={handleCancel}
                style={styles.actionButton}
                disabled={update.isPending}
              >
                <ThemedText>{update.isPending ? "Cancelando..." : "Cancelar Férias"}</ThemedText>
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                onPress={handleDelete}
                style={styles.actionButton}
                disabled={deleteVacation.isPending}
              >
                <IconTrash size={18} color={colors.destructiveForeground} />
                <ThemedText style={{ color: colors.destructiveForeground }}>
                  {deleteVacation.isPending ? "Excluindo..." : "Excluir"}
                </ThemedText>
              </Button>
            )}
          </View>
        )}

        {/* Info for collective vacations */}
        {vacation.isCollective && (
          <View style={StyleSheet.flatten([styles.infoBox, { backgroundColor: colors.muted + "20", borderColor: colors.border }])}>
            <ThemedText style={styles.infoText}>
              Esta é uma férias coletiva que se aplica a todos os funcionários. Você não pode cancelar ou excluir férias coletivas.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  infoBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
