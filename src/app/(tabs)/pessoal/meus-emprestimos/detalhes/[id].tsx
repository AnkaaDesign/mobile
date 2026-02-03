import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useBorrow, useScreenReady } from "@/hooks";
import { CHANGE_LOG_ENTITY_TYPE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { BORROW_SELECT_DETAIL } from "@/api-client/select-patterns";
import {
  IconPackage,
  IconEdit,
  IconHistory,
} from "@tabler/icons-react-native";
import { TouchableOpacity } from "react-native";
// import { showToast } from "@/components/ui/toast";

// Import modular components
import {
  BorrowCard,
  BorrowItemCard,
  BorrowDatesCard,
  BorrowUserCard,
  BorrowDetailSkeleton,
} from "@/components/personal/borrow/detail";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";

export default function BorrowDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  const id = params?.id || "";

  // Fetch borrow details with optimized select (40-60% less data)
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useBorrow(id, {
    select: BORROW_SELECT_DETAIL,
    enabled: !!id && id !== "",
  });

  const borrow = response?.data;

  const handleEdit = () => {
    if (borrow) {
      // For personal borrows, users typically cannot edit them
      // But we can show a toast or navigate to a return/request edit screen
      Alert.alert("Informação", "Para fazer alterações, entre em contato com o almoxarifado");
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      Alert.alert("Sucesso", "Dados atualizados com sucesso");
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <BorrowDetailSkeleton />
        </View>
      </View>
    );
  }

  if (error || !borrow || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={styles.card}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconPackage size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>
                Empréstimo não encontrado
              </ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                O empréstimo solicitado não foi encontrado ou pode ter sido removido.
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

  // Determine if user can request to return the item
  const canRequestReturn = borrow.status === "ACTIVE" && !borrow.returnedAt;

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
        {/* Borrow Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.headerLeft, { flex: 1 }]}>
              <IconPackage size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <ThemedText style={StyleSheet.flatten([styles.borrowTitle, { color: colors.foreground }])}>
                  {borrow.item?.name || "Empréstimo"}
                </ThemedText>
                {borrow.item?.uniCode && (
                  <ThemedText style={StyleSheet.flatten([styles.borrowSubtitle, { color: colors.mutedForeground }])}>
                    Código: {borrow.item.uniCode}
                  </ThemedText>
                )}
              </View>
            </View>
            {canRequestReturn && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>

        {/* Modular Components */}
        <BorrowCard borrow={borrow} />
        <BorrowItemCard borrow={borrow} />
        <BorrowDatesCard borrow={borrow} />
        <BorrowUserCard borrow={borrow} />

        {/* Changelog Timeline */}
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconHistory size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Histórico de Alterações</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.BORROW}
              entityId={borrow.id}
              entityName={borrow.item?.name || "Empréstimo"}
              entityCreatedAt={borrow.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  content: {
    gap: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  borrowTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  borrowSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs / 2,
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
});
