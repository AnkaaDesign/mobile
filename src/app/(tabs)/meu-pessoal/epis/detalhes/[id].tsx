import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePpeDelivery, usePpeDeliveryMutations } from '@/hooks';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import { IconShieldCheck, IconEdit, IconTrash } from "@tabler/icons-react-native";
// import { showToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants/enums";

// Import modular components
import {
  TeamPpeDeliveryCard,
  TeamPpeEmployeeCard,
  TeamPpeItemCard,
  TeamPpeStatusCard,
} from "@/components/my-team/ppe-delivery/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function TeamPpeDeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = usePpeDelivery(id, {
    include: {
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
      reviewedByUser: true,
      ppeSchedule: true,
    },
    enabled: !!id && id !== "",
  });

  const delivery = response?.data;

  const { deleteMutation } = usePpeDeliveryMutations();

  const handleEdit = () => {
    if (delivery) {
      // TODO: Navigate to edit page when implemented
      Alert.alert("Informação", "Edição ainda não implementada");
    }
  };

  const handleDelete = useCallback(() => {
    if (!delivery) return;

    Alert.alert(
      "Excluir Entrega",
      `Tem certeza que deseja excluir a entrega de ${delivery.item?.name || "item"} para ${delivery.user?.name || "usuário"}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(delivery.id);
              // API client already shows success alert
              router.back();
            } catch (error) {
              // API client already shows error alert
              console.error("Error deleting delivery:", error);
            }
          },
        },
      ]
    );
  }, [delivery, deleteMutation]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  // Check if user has access (team leader with matching sector)
  const hasAccess = currentUser?.managedSectorId && delivery?.user?.sectorId === currentUser.managedSectorId;

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando detalhes da entrega...
            </ThemedText>
          </Card>
        </View>
      </View>
    );
  }

  if (error || !delivery || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShieldCheck size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Entrega não encontrada
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A entrega solicitada não foi encontrada ou pode ter sido removida.
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

  // Access denied if not team leader of the employee's sector
  if (!hasAccess) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconShieldCheck size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Acesso Restrito
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                Você não tem permissão para visualizar esta entrega.
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
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconShieldCheck size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={StyleSheet.flatten([styles.deliveryTitle, { color: colors.foreground }])} numberOfLines={1}>
                  {delivery.item?.name || "Entrega de EPI"}
                </ThemedText>
                <ThemedText style={StyleSheet.flatten([styles.deliverySubtitle, { color: colors.mutedForeground }])} numberOfLines={1}>
                  {delivery.user?.name}
                </ThemedText>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEdit}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary, marginRight: spacing.xs }])}
                activeOpacity={0.7}
              >
                <IconEdit size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.destructive }])}
                activeOpacity={0.7}
              >
                <IconTrash size={18} color={colors.destructiveForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Modular Components */}
        <TeamPpeEmployeeCard delivery={delivery} />
        <TeamPpeItemCard delivery={delivery} />
        <TeamPpeDeliveryCard delivery={delivery} />
        <TeamPpeStatusCard delivery={delivery} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconShieldCheck size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>
                Histórico de Alterações
              </ThemedText>
            </View>
          </View>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.PPE_DELIVERY}
            entityId={delivery.id}
            entityName={`${delivery.user?.name} - ${delivery.item?.name}`}
            entityCreatedAt={delivery.createdAt}
            maxHeight={400}
          />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  headerCard: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deliveryTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
  },
  deliverySubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  errorContent: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
