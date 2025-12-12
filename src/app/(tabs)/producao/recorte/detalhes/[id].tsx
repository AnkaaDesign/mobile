import { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { CutRequestModal } from "@/components/production/cuts/form/cut-request-modal";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useCut, useCutMutations } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  SECTOR_PRIVILEGES,
  CUT_STATUS,
  CUT_TYPE,
  CUT_ORIGIN,
  CUT_REQUEST_REASON,
  CUT_STATUS_LABELS,
  CUT_TYPE_LABELS,
  CUT_ORIGIN_LABELS,
  CUT_REQUEST_REASON_LABELS,
  CHANGE_LOG_ENTITY_TYPE,
  routes,
} from "@/constants";
import { hasPrivilege, formatDate, isTeamLeader } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { FileItem, useFileViewer } from "@/components/file";
import { ENTITY_BADGE_CONFIG } from "@/constants/badge-colors";
import {
  IconTrash,
  IconScissors,
  IconHistory,
  IconFile,
  IconClipboardList,
  IconClock,
  IconHash,
  IconArrowBack,
  IconAlertCircle,
  IconReload,
  IconExternalLink,
  IconUser,
  IconBuildingFactory,
  IconChevronRight,
  IconPlayerPlay,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react-native";

export default function CuttingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, delete: deleteAsync } = useCutMutations();
  const [refreshing, setRefreshing] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  // Get file viewer context
  const fileViewer = useFileViewer();

  // Check permissions
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  // Team leadership is now determined by managedSector relationship
  const canRequestCut = isTeamLeader(user) ||
                        hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canChangeStatus =
    hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch cut details with all relations
  const { data: response, isLoading, error, refetch } = useCut(id as string, {
    include: {
      file: true,
      task: {
        include: {
          customer: true,
          sector: true,
        },
      },
      parentCut: {
        include: {
          file: true,
        },
      },
      childCuts: {
        include: {
          file: true,
        },
      },
    },
  });

  const cut = response?.data;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Erro", "Você não tem permissão para excluir");
      return;
    }

    Alert.alert(
      "Excluir Recorte",
      "Tem certeza que deseja excluir este recorte? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              Alert.alert("Sucesso", "Recorte excluído com sucesso");
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  // Handle status change
  const handleStatusChange = async (newStatus: CUT_STATUS) => {
    if (!cut) return;

    // Validate transition
    const validTransitions: Record<CUT_STATUS, CUT_STATUS[]> = {
      [CUT_STATUS.PENDING]: [CUT_STATUS.CUTTING],
      [CUT_STATUS.CUTTING]: [CUT_STATUS.COMPLETED],
      [CUT_STATUS.COMPLETED]: [],
    };

    if (!validTransitions[cut.status as CUT_STATUS]?.includes(newStatus)) {
      Alert.alert("Erro", "Transição de status inválida");
      return;
    }

    const statusLabel = CUT_STATUS_LABELS[newStatus];
    Alert.alert(
      "Confirmar Mudança de Status",
      `Deseja alterar o status para "${statusLabel}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              const updateData: any = { status: newStatus };

              // Add required dates based on status
              if (newStatus === CUT_STATUS.CUTTING && !cut.startedAt) {
                updateData.startedAt = new Date();
              }
              if (newStatus === CUT_STATUS.COMPLETED && !cut.completedAt) {
                updateData.completedAt = new Date();
              }

              await update({ id: cut.id, data: updateData });
              Alert.alert("Sucesso", "Status atualizado com sucesso");
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  // Handle request cut
  const handleRequestCut = () => {
    if (!canRequestCut) {
      Alert.alert("Erro", "Você não tem permissão para solicitar cortes");
      return;
    }
    setRequestModalVisible(true);
  };

  // Handle request success
  const handleRequestSuccess = () => {
    setRequestModalVisible(false);
    Alert.alert("Sucesso", "Cortes solicitados com sucesso");
    refetch();
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: CUT_STATUS) => {
    return (ENTITY_BADGE_CONFIG.CUT[status] || "default") as any;
  };

  // Calculate duration
  const getDuration = () => {
    if (!cut?.startedAt) return null;
    const start = new Date(cut.startedAt);
    const end = cut.completedAt ? new Date(cut.completedAt) : new Date();
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} minutos`;
  };

  // Generate page title
  const pageTitle = cut?.file?.filename
    ? `Recorte - ${cut.file.filename}`
    : cut?.task?.name
      ? `Recorte - ${cut.task.name}`
      : "Detalhes do Recorte";

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do recorte..." />;
  }

  if (error || !cut) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do recorte"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Page Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <ThemedText
                style={[styles.pageTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {pageTitle}
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              {canRequestCut && (
                <TouchableOpacity
                  onPress={handleRequestCut}
                  style={[styles.actionButton, { backgroundColor: (colors as any).info || "#3b82f6" }]}
                  activeOpacity={0.7}
                >
                  <IconScissors size={18} color="#ffffff" />
                </TouchableOpacity>
              )}
              {cut.status === CUT_STATUS.PENDING && canChangeStatus && (
                <TouchableOpacity
                  onPress={() => handleStatusChange(CUT_STATUS.CUTTING)}
                  style={[styles.actionButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.7}
                >
                  <IconPlayerPlay size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {cut.status === CUT_STATUS.CUTTING && canChangeStatus && (
                <TouchableOpacity
                  onPress={() => handleStatusChange(CUT_STATUS.COMPLETED)}
                  style={[styles.actionButton, { backgroundColor: "#16a34a" }]}
                  activeOpacity={0.7}
                >
                  <IconCheck size={18} color="#ffffff" />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.actionButton, { backgroundColor: colors.destructive }]}
                  activeOpacity={0.7}
                >
                  <IconTrash size={18} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>

        {/* Request Reason Alert - Prominent display for requests */}
        {cut.reason && (
          <Card
            style={[
              styles.card,
              {
                backgroundColor: colors.destructive + "15",
                borderColor: colors.destructive,
                borderWidth: 1,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: colors.destructive }]}>
              <IconAlertTriangle size={20} color={colors.destructive} />
              <ThemedText style={[styles.sectionTitle, { color: colors.destructive }]}>
                Motivo da Requisição
              </ThemedText>
            </View>
            <ThemedText style={[styles.reasonText, { color: colors.destructive }]}>
              {CUT_REQUEST_REASON_LABELS[cut.reason as CUT_REQUEST_REASON]}
            </ThemedText>
          </Card>
        )}

        {/* General Information Card with File Preview */}
        <Card style={styles.card}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <IconScissors size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>Informações Gerais</ThemedText>
            <Badge variant={getStatusBadgeVariant(cut.status as CUT_STATUS)} style={{ marginLeft: "auto" }}>
              {CUT_STATUS_LABELS[cut.status as CUT_STATUS]}
            </Badge>
          </View>

          {/* File Preview */}
          {cut.file && (
            <View style={styles.fileContainer}>
              <FileItem
                file={cut.file}
                viewMode="grid"
                baseUrl={process.env.EXPO_PUBLIC_API_URL}
                onPress={() => cut.file && fileViewer.actions.viewFile(cut.file)}
              />
            </View>
          )}

          {/* Info Rows */}
          <View style={styles.infoRows}>
            {/* Origin */}
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
              <View style={styles.infoRowLeft}>
                <IconArrowBack size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Origem</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {CUT_ORIGIN_LABELS[cut.origin as CUT_ORIGIN]}
              </ThemedText>
            </View>

            {/* Type */}
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
              <View style={styles.infoRowLeft}>
                <IconHash size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Tipo</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {CUT_TYPE_LABELS[cut.type as CUT_TYPE]}
              </ThemedText>
            </View>

            {/* Duration */}
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
              <View style={styles.infoRowLeft}>
                <IconClock size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Tempo de Execução</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: getDuration() ? colors.foreground : colors.mutedForeground }]}>
                {getDuration() || "Não iniciado"}
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Parent Cut (if recut) */}
        {cut.parentCut && (
          <Card
            style={[
              styles.card,
              { backgroundColor: colors.warning + "10", borderColor: colors.warning, borderWidth: 1 },
            ]}
          >
            <View style={[styles.sectionHeader, { borderBottomColor: colors.warning }]}>
              <IconReload size={20} color={colors.warning} />
              <ThemedText style={[styles.sectionTitle, { color: colors.warning }]}>Este é um Retrabalho</ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.relatedItem, { backgroundColor: colors.muted + "30" }]}
              onPress={() => router.push(routes.production.cutting.details(cut.parentCut!.id) as any)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.relatedItemName}>
                  {cut.parentCut.file?.filename || "Recorte Original"}
                </ThemedText>
                <ThemedText style={[styles.relatedItemDate, { color: colors.mutedForeground }]}>
                  Criado em {formatDate(cut.parentCut.createdAt)}
                </ThemedText>
              </View>
              <IconExternalLink size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </Card>
        )}

        {/* Task Information Card */}
        {cut.task && (
          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <IconClipboardList size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Informações da Tarefa</ThemedText>
              <TouchableOpacity
                onPress={() => router.push(`/producao/cronograma/detalhes/${cut.task!.id}`)}
                style={styles.linkButton}
                activeOpacity={0.7}
              >
                <IconExternalLink size={14} color={colors.primary} />
                <ThemedText style={[styles.linkText, { color: colors.primary }]}>Ver</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.infoRows}>
              {/* Task Name */}
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
                <View style={styles.infoRowLeft}>
                  <IconClipboardList size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Nome</ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                  {cut.task.name}
                </ThemedText>
              </View>

              {/* Customer */}
              {cut.task.customer && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
                  <View style={styles.infoRowLeft}>
                    <IconUser size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Cliente</ThemedText>
                  </View>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {cut.task.customer.fantasyName}
                  </ThemedText>
                </View>
              )}

              {/* Sector */}
              {cut.task.sector && (
                <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
                  <View style={styles.infoRowLeft}>
                    <IconBuildingFactory size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Setor</ThemedText>
                  </View>
                  <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                    {cut.task.sector.name}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Dates Section */}
        <Card style={styles.card}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <IconClock size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>Datas</ThemedText>
          </View>
          <View style={styles.infoRows}>
            <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Solicitado em</ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>{formatDate(cut.createdAt)}</ThemedText>
            </View>

            {cut.startedAt && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Iniciado em</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>{formatDate(cut.startedAt)}</ThemedText>
              </View>
            )}

            {cut.completedAt && (
              <View style={[styles.infoRow, { backgroundColor: colors.muted + "30" }]}>
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>Concluído em</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>{formatDate(cut.completedAt)}</ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Child Cuts (Recuts) Section */}
        {cut.childCuts && cut.childCuts.length > 0 && (
          <Card style={styles.card}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
              <IconReload size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.sectionTitle}>Retrabalhos Realizados</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: "auto" }}>
                {cut.childCuts.length}
              </Badge>
            </View>
            <View style={styles.relatedList}>
              {cut.childCuts.map((childCut: any) => (
                <TouchableOpacity
                  key={childCut.id}
                  style={[styles.relatedItem, { backgroundColor: colors.muted + "30" }]}
                  onPress={() => router.push(routes.production.cutting.details(childCut.id) as any)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.relatedItemHeader}>
                      <IconScissors size={14} color={colors.mutedForeground} />
                      <ThemedText style={styles.relatedItemName} numberOfLines={1}>
                        {childCut.file?.filename || "Recorte"}
                      </ThemedText>
                      <Badge variant={getStatusBadgeVariant(childCut.status as CUT_STATUS)}>
                        {CUT_STATUS_LABELS[childCut.status as CUT_STATUS]}
                      </Badge>
                    </View>
                    {childCut.reason && (
                      <View style={styles.relatedItemReason}>
                        <IconAlertCircle size={12} color={colors.destructive} />
                        <ThemedText style={[styles.relatedItemReasonText, { color: colors.destructive }]}>
                          {CUT_REQUEST_REASON_LABELS[childCut.reason as CUT_REQUEST_REASON]}
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText style={[styles.relatedItemDate, { color: colors.mutedForeground }]}>
                      Criado em {formatDate(childCut.createdAt)}
                    </ThemedText>
                  </View>
                  <IconChevronRight size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Changelog History */}
        <Card style={styles.card}>
          <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
            <IconHistory size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.CUT}
            entityId={cut.id}
            entityName={cut.file?.filename || "Recorte"}
            entityCreatedAt={cut.createdAt}
            maxHeight={400}
          />
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <View style={{ height: spacing.xxl * 2 }} />
      </View>

      {/* Cut Request Modal */}
      <CutRequestModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
        cutItem={cut}
        onSuccess={handleRequestSuccess}
      />
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
  card: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  fileContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  infoRows: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: "50%",
    textAlign: "right",
  },
  reasonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  linkText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  relatedList: {
    gap: spacing.sm,
  },
  relatedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  relatedItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  relatedItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  relatedItemReason: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.xs,
  },
  relatedItemReasonText: {
    fontSize: fontSize.xs,
  },
  relatedItemDate: {
    fontSize: fontSize.xs,
  },
});
