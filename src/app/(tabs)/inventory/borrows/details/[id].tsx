import React, { useState } from "react";
import { View, ScrollView, Alert, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useBorrow, useBorrowMutations } from '../../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { BORROW_STATUS, SECTOR_PRIVILEGES } from '../../../../../constants';
import { hasPrivilege } from '../../../../../utils';
import { showToast } from "@/components/ui/toast";
import { BorrowStatusCard } from "@/components/inventory/borrow/detail/borrow-status-card";
import { BorrowItemInfoCard } from "@/components/inventory/borrow/detail/borrow-item-info-card";
import { BorrowUserInfoCard } from "@/components/inventory/borrow/detail/borrow-user-info-card";
import { BorrowDatesCard } from "@/components/inventory/borrow/detail/borrow-dates-card";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from "@tabler/icons-react-native";

export default function BorrowDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, delete: deleteAsync } = useBorrowMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Check permissions
  const canManageWarehouse = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) || hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const isAdmin = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch borrow details
  const { data: response, isLoading, error, refetch } = useBorrow(id as string, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
    enabled: !!id && canManageWarehouse,
  });

  const borrow = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canManageWarehouse) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/inventory/borrows/edit/${id}`);
  };

  // Handle return
  const handleReturn = () => {
    Alert.alert(
      "Devolver Item",
      "Confirma a devolução deste item?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Devolver",
          style: "default",
          onPress: async () => {
            try {
              await update({
                id: id as string,
                data: {
                  status: BORROW_STATUS.RETURNED,
                  returnedAt: new Date(),
                },
              });
              await refetch();
              showToast({ message: "Item devolvido com sucesso", type: "success" });
            } catch (error) {
              showToast({ message: "Erro ao devolver o item", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Handle mark as lost
  const handleMarkAsLost = () => {
    Alert.alert(
      "Marcar como Perdido",
      "Tem certeza que deseja marcar este item como perdido? Esta ação é irreversível.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar como Perdido",
          style: "destructive",
          onPress: async () => {
            try {
              await update({
                id: id as string,
                data: { status: BORROW_STATUS.LOST },
              });
              await refetch();
              showToast({ message: "Item marcado como perdido", type: "success" });
            } catch (error) {
              showToast({ message: "Erro ao marcar o item como perdido", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!isAdmin) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Empréstimo",
      "Tem certeza que deseja excluir este empréstimo? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Empréstimo excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir empréstimo", type: "error" });
            }
          },
        },
      ]
    );
  };

  // Permission gate
  if (!canManageWarehouse) {
    return (
      <ErrorScreen
        message="Acesso negado"
        detail="Você não tem permissão para acessar esta funcionalidade."
      />
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do empréstimo..." />;
  }

  if (error || !borrow) {
    return (
      <ErrorScreen
        message="Erro ao carregar empréstimo"
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
        {/* Header Card with Title and Actions */}
        <Card>
          <CardContent style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText style={StyleSheet.flatten([styles.borrowTitle, { color: colors.foreground }])} numberOfLines={2}>
                Empréstimo #{borrow.id.slice(0, 8)}
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
              {canManageWarehouse && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {isAdmin && (
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

        {/* Status Card */}
        <BorrowStatusCard borrow={borrow} />

        {/* Item Information Card */}
        <BorrowItemInfoCard borrow={borrow} />

        {/* User Information Card */}
        <BorrowUserInfoCard borrow={borrow} />

        {/* Borrow Details/Dates Card */}
        <BorrowDatesCard borrow={borrow} />

        {/* Action Buttons */}
        {borrow.status === BORROW_STATUS.ACTIVE && (
          <Card style={styles.actionsCard}>
            <TouchableOpacity
              onPress={handleReturn}
              style={StyleSheet.flatten([styles.returnButton, { backgroundColor: colors.primary }])}
              activeOpacity={0.7}
            >
              <IconCheck size={20} color={colors.primaryForeground} />
              <ThemedText style={StyleSheet.flatten([styles.buttonText, { color: colors.primaryForeground }])}>
                Devolver Item
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMarkAsLost}
              style={StyleSheet.flatten([styles.lostButton, { borderColor: colors.border, backgroundColor: colors.card }])}
              activeOpacity={0.7}
            >
              <IconX size={20} color={colors.destructive} />
              <ThemedText style={StyleSheet.flatten([styles.buttonText, { color: colors.destructive }])}>
                Marcar como Perdido
              </ThemedText>
            </TouchableOpacity>
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
    marginRight: spacing.sm,
  },
  borrowTitle: {
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
  actionsCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  lostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
