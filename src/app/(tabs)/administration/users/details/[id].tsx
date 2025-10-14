import React, { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser } from '../../../../../hooks';
import { routes, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { Card, CardContent } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Header } from "@/components/ui/header";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconUser, IconRefresh, IconEdit, IconHistory } from "@tabler/icons-react-native";
import { routeToMobilePath } from "@/lib/route-mapper";
import { showToast } from "@/components/ui/toast";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { Card as UICard, CardHeader, CardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from '../../../../../utils';

// Import modular components
import { UserCard } from "@/components/administration/user/detail";
import { UserDetailSkeleton } from "@/components/administration/user/skeleton/user-detail-skeleton";

export default function UserDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useUser(id, {
    include: {
      position: true,
      sector: true,
      managedSector: true,
      _count: {
        select: {
          tasks: true,
          createdTasks: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const user = response?.data;

  const handleEdit = () => {
    if (user) {
      router.push(routeToMobilePath(routes.administration.collaborators.edit(user.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <Header
          title="Detalhes do Usuário"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <UserDetailSkeleton />
      </View>
    );
  }

  if (error || !user || !id || id === "") {
    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        <Header
          title="Detalhes do Usuário"
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
          <View style={styles.container}>
            <Card>
              <CardContent style={styles.errorContent}>
                <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
                  <IconUser size={32} color={colors.mutedForeground} />
                </View>
                <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
                  Usuário não encontrado
                </ThemedText>
                <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
                  O usuário solicitado não foi encontrado ou pode ter sido removido.
                </ThemedText>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* Enhanced Header */}
      <Header
        title={user.name}
        showBackButton={true}
        onBackPress={() => router.back()}
        rightAction={
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.muted,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <IconRefresh size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <IconEdit size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
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
          {/* Main User Card */}
          <UserCard user={user} />

          {/* Login Information Card */}
          <UICard>
            <CardHeader>
              <CardTitle>Informações de Login</CardTitle>
            </CardHeader>
            <UICardContent>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Último Login
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : "Nunca"}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Email Verificado
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.verified ? "Sim" : "Não"}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Requer Mudança de Senha
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.requirePasswordChange ? "Sim" : "Não"}
                </ThemedText>
              </View>
            </UICardContent>
          </UICard>

          {/* Activity Stats Card */}
          {user._count && (
            <UICard>
              <CardHeader>
                <CardTitle>Estatísticas de Atividade</CardTitle>
              </CardHeader>
              <UICardContent>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                      {user._count.createdTasks || 0}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Tarefas Criadas
                    </ThemedText>
                  </View>
                  <View style={styles.statItem}>
                    <ThemedText style={[styles.statValue, { color: colors.success }]}>
                      {user._count.tasks || 0}
                    </ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                      Tarefas Atribuídas
                    </ThemedText>
                  </View>
                </View>
              </UICardContent>
            </UICard>
          )}

          {/* System Information Card */}
          <UICard>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <UICardContent>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  ID
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground, fontFamily: "monospace" }]}>
                  {user.id}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Criado em
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(new Date(user.createdAt))}
                </ThemedText>
              </View>
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Última Atualização
                </ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(new Date(user.updatedAt))}
                </ThemedText>
              </View>
            </UICardContent>
          </UICard>

          {/* Changelog Timeline */}
          <UICard>
            <CardHeader>
              <CardTitle style={styles.sectionTitle}>
                <View style={styles.titleRow}>
                  <View style={[styles.titleIcon, { backgroundColor: colors.primary + "10" }]}>
                    <IconHistory size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.titleText, { color: colors.foreground }]}>
                    Histórico de Alterações
                  </ThemedText>
                </View>
              </CardTitle>
            </CardHeader>
            <UICardContent style={{ paddingHorizontal: 0 }}>
              <ChangelogTimeline
                entityType={CHANGE_LOG_ENTITY_TYPE.USER}
                entityId={user.id}
                entityName={user.name}
                entityCreatedAt={user.createdAt}
                maxHeight={400}
              />
            </UICardContent>
          </UICard>

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  errorContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl * 2,
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
    paddingHorizontal: spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    textAlign: "right",
    flex: 1,
    marginLeft: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    textAlign: "center",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
