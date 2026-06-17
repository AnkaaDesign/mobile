import { View, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useMessage, useMessageStats } from "@/hooks/use-admin-messages-infinite-mobile";
import { routes, SECTOR_PRIVILEGES } from "@/constants";
import { mobileRoute } from "@/constants/routes.types";
import { DetailScreen } from "@/components/screens/detail-screen";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { IconMessage } from "@tabler/icons-react-native";
import { MessageBlockRenderer } from "@/components/ui/message-block-renderer";
import { transformMessageContent } from "@/utils/message-transformer";
import { getBadgeVariant, BADGE_COLORS } from "@/constants/badge-colors";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendada',
  ACTIVE: 'Ativa',
  EXPIRED: 'Expirada',
  ARCHIVED: 'Arquivada',
};

export default function MessageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const query = useMessage(id as string, {
    include: {
      createdBy: true,
      targets: { include: { user: true } },
    },
    enabled: !!id,
  });

  const { data: statsResponse } = useMessageStats(id as string, { enabled: !!id });
  const stats = statsResponse?.data;

  // Editable when not archived. Resolve editRoute conditionally based on
  // the loaded entity (DetailScreen template's editGuard is enum-based;
  // for status === 'ARCHIVED' we use a closure check instead).
  const message = (query.data as any)?.data ?? (query.data as any);
  const canEdit = message && message.status !== "ARCHIVED";

  return (
    <DetailScreen<any>
      query={query as any}
      icon={IconMessage}
      title={(m) => m.title ?? "Mensagem"}
      privilege={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.PRODUCTION_MANAGER] }}
      editRoute={canEdit ? (m) => mobileRoute(routes.administration.messages.edit(m.id)) : undefined}
      notFoundFallback={mobileRoute(routes.administration.messages.list)}
    >
      {(message) => {
        const contentBlocks = transformMessageContent(message.content);
        const targetCount = message.targetCount || message.targets?.length || 0;
        const formattedDate = message.createdAt
          ? new Date(message.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
        const publishedDate = message.publishedAt
          ? new Date(message.publishedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : null;
        const badgeVariant = getBadgeVariant(message.status, "MESSAGE");
        const badgeColors = BADGE_COLORS[badgeVariant] || BADGE_COLORS.default;

        return (
          <View style={styles.body}>
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
                    {targetCount === 0 ? "Todos os usuários" : `${targetCount} usuário(s)`}
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
                      <StatItem label="Visualizações" value={stats.totalViews || 0} colors={colors} />
                      <StatItem label="Únicos" value={stats.uniqueViewers || 0} colors={colors} />
                      <StatItem label="Dispensadas" value={stats.totalDismissals || 0} colors={colors} />
                      <StatItem label="Alvo" value={stats.targetedUsers || 0} colors={colors} />
                    </View>
                  </>
                )}
              </View>
            </Card>

            <Card style={{ padding: spacing.md }}>
              <View style={{ gap: spacing.sm }}>
                <ThemedText style={{ fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground }}>
                  Conteúdo
                </ThemedText>
                {contentBlocks && contentBlocks.length > 0 ? (
                  <MessageBlockRenderer blocks={contentBlocks} />
                ) : (
                  <ThemedText style={{ color: colors.mutedForeground, fontStyle: "italic" }}>
                    Sem conteúdo
                  </ThemedText>
                )}
              </View>
            </Card>
          </View>
        );
      }}
    </DetailScreen>
  );
}

function StatItem({ label, value, colors }: { label: string; value: number; colors: any }) {
  return (
    <View style={[styles.statItem, { backgroundColor: colors.muted }]}>
      <ThemedText style={[styles.statValue, { color: colors.foreground }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
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
