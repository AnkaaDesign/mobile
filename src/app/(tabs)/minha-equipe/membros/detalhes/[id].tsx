import { useState, useCallback } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useUser, useCurrentUser } from "@/hooks";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize } from "@/constants/design-system";
import {
  IconUser,
  IconPhone,
  IconMail,
  IconBriefcase,
  IconMapPin,
  IconCalendar,
  IconIdBadge,
  IconBuilding,
  IconStar,
  IconClock,
  IconAlertTriangle,
  IconPackage,
  IconBeach,
  IconClipboard,
} from "@tabler/icons-react-native";
import { USER_STATUS } from "@/constants";
import { formatDate } from "@/utils";
import { showToast } from "@/components/ui/toast";

// Helper function to get status label
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: "Experiência 1",
    [USER_STATUS.EXPERIENCE_PERIOD_2]: "Experiência 2",
    [USER_STATUS.EFFECTED]: "Efetivo",
    [USER_STATUS.DISMISSED]: "Demitido",
  };
  return statusLabels[status] || status;
};

// Helper function to get status color
const getStatusColor = (status: string, colors: any) => {
  const statusColors: Record<string, string> = {
    [USER_STATUS.EXPERIENCE_PERIOD_1]: colors.warning,
    [USER_STATUS.EXPERIENCE_PERIOD_2]: colors.warning,
    [USER_STATUS.EFFECTED]: colors.success,
    [USER_STATUS.DISMISSED]: colors.destructive,
  };
  return statusColors[status] || colors.mutedForeground;
};

export default function TeamMemberDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();

  const id = params?.id || "";

  // Check if user is a team leader
  const isTeamLeader = !!currentUser?.managedSectorId;

  const {
    data: response,
    isLoading: isLoadingMember,
    error,
    refetch,
  } = useUser(id, {
    include: {
      position: {
        include: {
          remunerations: true,
        },
      },
      sector: true,
      ppeSize: true,
      preference: true,
      _count: {
        select: {
          activities: true,
          borrows: true,
          vacations: true,
          warningsCollaborator: true,
          ppeDeliveries: true,
          bonuses: true,
        },
      },
    },
    enabled: !!id && id !== "",
  });

  const member = response?.data;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => {
      setRefreshing(false);
      showToast({ message: "Dados atualizados com sucesso", type: "success" });
    });
  }, [refetch]);

  // Combined loading state
  const isLoading = isLoadingCurrentUser || isLoadingMember;

  // Show loading while fetching current user or member data
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando dados do colaborador...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    );
  }

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
            <Button onPress={() => router.back()}>
              <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  if (error || !member || !id) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
              Colaborador não encontrado
            </ThemedText>
            <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
              O colaborador solicitado não foi encontrado ou pode ter sido removido.
            </ThemedText>
            <Button onPress={() => router.back()}>
              <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  // Verify the member belongs to the leader's team
  if (member.sectorId !== currentUser?.managedSectorId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <View style={[styles.errorIcon, { backgroundColor: colors.muted }]}>
              <IconUser size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.foreground }]}>
              Acesso Negado
            </ThemedText>
            <ThemedText style={[styles.errorDescription, { color: colors.mutedForeground }]}>
              Você só pode visualizar membros da sua própria equipe.
            </ThemedText>
            <Button onPress={() => router.back()}>
              <ThemedText style={{ color: colors.primaryForeground }}>Voltar</ThemedText>
            </Button>
          </Card>
        </View>
      </ThemedView>
    );
  }

  return (
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
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Avatar
              source={member.avatar?.url ? { uri: member.avatar.url } : undefined}
              fallback={member.name?.[0]?.toUpperCase() || "U"}
              size="lg"
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.memberName, { color: colors.foreground }]}>
                {member.name}
              </ThemedText>
              {member.position && (
                <ThemedText style={[styles.memberPosition, { color: colors.mutedForeground }]}>
                  {member.position.name}
                </ThemedText>
              )}
              <Badge
                variant="secondary"
                style={{
                  backgroundColor: getStatusColor(member.status, colors) + "20",
                  marginTop: spacing.xs,
                }}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: getStatusColor(member.status, colors) },
                  ]}
                >
                  {getStatusLabel(member.status)}
                </ThemedText>
              </Badge>
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Card style={styles.card}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <IconPhone size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
              Informações de Contato
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            {member.email && (
              <View style={styles.infoRow}>
                <IconMail size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    E-mail
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {member.email}
                  </ThemedText>
                </View>
              </View>
            )}
            {member.phone && (
              <View style={styles.infoRow}>
                <IconPhone size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Telefone
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {member.phone}
                  </ThemedText>
                </View>
              </View>
            )}
            {(member.city || member.state) && (
              <View style={styles.infoRow}>
                <IconMapPin size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Localização
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {[member.city, member.state].filter(Boolean).join(", ")}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Professional Information */}
        <Card style={styles.card}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <IconBriefcase size={20} color={colors.mutedForeground} />
            <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
              Informações Profissionais
            </ThemedText>
          </View>
          <View style={styles.cardContent}>
            {member.position && (
              <View style={styles.infoRow}>
                <IconBriefcase size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Cargo
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {member.position.name}
                  </ThemedText>
                </View>
              </View>
            )}
            {member.sector && (
              <View style={styles.infoRow}>
                <IconBuilding size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Setor
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {member.sector.name}
                  </ThemedText>
                </View>
              </View>
            )}
            {member.admissional && (
              <View style={styles.infoRow}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Data de Admissão
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {formatDate(member.admissional)}
                  </ThemedText>
                </View>
              </View>
            )}
            {member.performanceLevel !== undefined && (
              <View style={styles.infoRow}>
                <IconStar size={16} color={colors.mutedForeground} />
                <View style={styles.infoTextContainer}>
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Nível de Desempenho
                  </ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {member.performanceLevel}/5
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* Documents */}
        {(member.cpf || member.pis) && (
          <Card style={styles.card}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <IconIdBadge size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
                Documentos
              </ThemedText>
            </View>
            <View style={styles.cardContent}>
              {member.cpf && (
                <View style={styles.infoRow}>
                  <IconIdBadge size={16} color={colors.mutedForeground} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      CPF
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                      {member.cpf}
                    </ThemedText>
                  </View>
                </View>
              )}
              {member.pis && (
                <View style={styles.infoRow}>
                  <IconIdBadge size={16} color={colors.mutedForeground} />
                  <View style={styles.infoTextContainer}>
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      PIS
                    </ThemedText>
                    <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                      {member.pis}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Statistics */}
        {member._count && (
          <Card style={styles.card}>
            <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
              <IconClipboard size={20} color={colors.mutedForeground} />
              <ThemedText style={[styles.cardTitle, { color: colors.foreground }]}>
                Estatísticas
              </ThemedText>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <IconClock size={24} color={colors.primary} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.activities || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Atividades
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconPackage size={24} color={colors.primary} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.borrows || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Empréstimos
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconBeach size={24} color={colors.primary} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.vacations || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Férias
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconAlertTriangle size={24} color={colors.warning} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.warningsCollaborator || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Advertências
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconClipboard size={24} color={colors.primary} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.ppeDeliveries || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  EPIs
                </ThemedText>
              </View>
              <View style={styles.statItem}>
                <IconStar size={24} color={colors.success} />
                <ThemedText style={[styles.statValue, { color: colors.foreground }]}>
                  {member._count.bonuses || 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Bonificações
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

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
    padding: spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  memberName: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  memberPosition: {
    fontSize: fontSize.base,
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  cardContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.base,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: spacing.md,
  },
  statItem: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: fontSize.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    padding: spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorCard: {
    padding: spacing.xl,
    alignItems: "center",
    width: "100%",
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
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorDescription: {
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});