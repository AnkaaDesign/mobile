import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useMessage, useMessageStats } from '@/hooks/use-admin-messages-infinite-mobile';
import { routes } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconMessage, IconEdit } from "@tabler/icons-react-native";
import { routeToMobilePath } from '@/utils/route-mapper';
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
import { transformMessageContent } from "@/utils/message-transformer";
import { SkeletonCard } from "@/components/ui/loading";
import { getBadgeVariant, BADGE_COLORS } from "@/constants/badge-colors";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  ARCHIVED: 'Arquivada',
};

export default function MessageDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const id = params?.id || "";

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useMessage(id, {
    include: {
      createdBy: true,
      targets: {
        include: {
          user: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const { data: statsResponse } = useMessageStats(id, { enabled: !!id && id !== "" });

  useScreenReady(!isLoading);

  const message = response?.data || response;

  const handleEdit = () => {
    if (message) {
      router.push(routeToMobilePath(routes.administration.messages.edit(message.id)) as any);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
    });
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <View style={{ gap: spacing.md, paddingTop: spacing.md }}>
            <SkeletonCard style={{ height: 60 }} />
            <SkeletonCard style={{ height: 200 }} />
            <SkeletonCard style={{ height: 200 }} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !message || !id || id === "") {
    return (
      <View style={StyleSheet.flatten([styles.scrollView, { backgroundColor: colors.background }])}>
        <View style={styles.container}>
          <Card style={{ padding: spacing.md }}>
            <View style={styles.errorContent}>
              <View style={StyleSheet.flatten([styles.errorIcon, { backgroundColor: colors.muted }])}>
                <IconMessage size={32} color={colors.mutedForeground} />
              </View>
              <ThemedText style={StyleSheet.flatten([styles.errorTitle, { color: colors.foreground }])}>Mensagem não encontrada</ThemedText>
              <ThemedText style={StyleSheet.flatten([styles.errorDescription, { color: colors.mutedForeground }])}>
                A mensagem solicitada não foi encontrada ou pode ter sido removida.
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

  const stats = statsResponse?.data;
  const canEdit = message.status !== 'ARCHIVED';
  const contentBlocks = transformMessageContent(message.content);
  const targetCount = message.targetCount || message.targets?.length || 0;
  const formattedDate = message.createdAt ? new Date(message.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const publishedDate = message.publishedAt ? new Date(message.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  // Use centralized badge color system (same as list view)
  const badgeVariant = getBadgeVariant(message.status, 'MESSAGE');
  const badgeColors = BADGE_COLORS[badgeVariant] || BADGE_COLORS.default;

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
            <View style={styles.headerLeft}>
              <IconMessage size={24} color={colors.primary} />
              <ThemedText style={StyleSheet.flatten([styles.headerTitle, { color: colors.foreground }])}>
                {message.title}
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
            </View>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={{ padding: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <ThemedText style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>
              Informações
            </ThemedText>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Status</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: badgeColors.bg }]}>
                <ThemedText style={[styles.statusText, { color: badgeColors.text }]}>
                  {STATUS_LABELS[message.status] || message.status}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Público-Alvo</ThemedText>
              <ThemedText style={{ color: colors.foreground }}>
                {targetCount === 0 ? 'Todos os usuários' : `${targetCount} usuário(s)`}
              </ThemedText>
            </View>

            {message.createdBy && (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Criado por</ThemedText>
                <ThemedText style={{ color: colors.foreground }}>{message.createdBy.name}</ThemedText>
              </View>
            )}

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Criado em</ThemedText>
              <ThemedText style={{ color: colors.foreground }}>{formattedDate}</ThemedText>
            </View>

            {publishedDate && (
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Publicado em</ThemedText>
                <ThemedText style={{ color: colors.foreground }}>{publishedDate}</ThemedText>
              </View>
            )}

            {stats && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <ThemedText style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground }}>
                  Estatísticas
                </ThemedText>
                <View style={styles.statsGrid}>
                  <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{stats.totalViews || 0}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Visualizações</ThemedText>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{stats.uniqueViewers || 0}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Únicos</ThemedText>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{stats.totalDismissals || 0}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Dispensadas</ThemedText>
                  </View>
                  <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
                    <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{stats.targetedUsers || 0}</ThemedText>
                    <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>Alvo</ThemedText>
                  </View>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Content Preview */}
        <Card style={{ padding: spacing.md }}>
          <View style={{ gap: spacing.sm }}>
            <ThemedText style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>
              Conteúdo
            </ThemedText>
            {contentBlocks && contentBlocks.length > 0 ? (
              <MessageBlockRenderer blocks={contentBlocks} />
            ) : (
              <ThemedText style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>
                Sem conteúdo
              </ThemedText>
            )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    flex: 1,
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
    paddingHorizontal: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
