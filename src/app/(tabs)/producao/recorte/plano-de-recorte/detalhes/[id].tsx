import React, { useState } from "react";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
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
  CHANGE_LOG_ENTITY_TYPE
} from "@/constants";
import { hasPrivilege, formatDate } from "@/utils";
import { showToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { FileItem, useFileViewer } from "@/components/file";
import { ENTITY_BADGE_CONFIG } from "@/constants/badge-colors";
import {
  IconRefresh,
  IconEdit,
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
} from "@tabler/icons-react-native";

export default function CuttingPlanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, delete: deleteAsync } = useCutMutations();
  const [refreshing, setRefreshing] = useState(false);

  // Get file viewer context
  const fileViewer = useFileViewer();

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.PRODUCTION) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE) ||
                  hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

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
    showToast({ message: "Detalhes atualizados", type: "success" });
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/producao/recorte/plano-de-recorte/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Plano de Recorte",
      "Tem certeza que deseja excluir este plano de recorte? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Plano de recorte excluído com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir plano de recorte", type: "error" });
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
      showToast({ message: "Transição de status inválida", type: "error" });
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
              showToast({ message: "Status atualizado com sucesso", type: "success" });
            } catch (error) {
              showToast({ message: "Erro ao atualizar status", type: "error" });
            }
          },
        },
      ]
    );
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

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do plano de recorte..." />;
  }

  if (error || !cut) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes do plano de recorte"
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
              <ThemedText style={StyleSheet.flatten([styles.taskTitle, { color: colors.foreground }])} numberOfLines={2}>
                {cut.file?.filename || "Plano de Recorte"}
              </ThemedText>
              <Badge variant={getStatusBadgeVariant(cut.status as CUT_STATUS)} style={{ marginTop: spacing.xs, alignSelf: "flex-start" }}>
                {CUT_STATUS_LABELS[cut.status as CUT_STATUS]}
              </Badge>
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
              {canEdit && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={StyleSheet.flatten([styles.actionButton, { backgroundColor: colors.primary }])}
                  activeOpacity={0.7}
                >
                  <IconEdit size={18} color={colors.primaryForeground} />
                </TouchableOpacity>
              )}
              {canDelete && (
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

        {/* Basic Information Card */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconScissors size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Informações Básicas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            {/* Status with Actions */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                <Badge variant={getStatusBadgeVariant(cut.status as CUT_STATUS)}>
                  {CUT_STATUS_LABELS[cut.status as CUT_STATUS]}
                </Badge>
                {cut.status === CUT_STATUS.PENDING && canEdit && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(CUT_STATUS.CUTTING)}
                    style={[styles.statusActionButton, { backgroundColor: colors.primary }]}
                    activeOpacity={0.7}
                  >
                    <IconPlayerPlay size={14} color={colors.primaryForeground} />
                    <ThemedText style={[styles.statusActionText, { color: colors.primaryForeground }]}>
                      Iniciar
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {cut.status === CUT_STATUS.CUTTING && canEdit && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(CUT_STATUS.COMPLETED)}
                    style={[styles.statusActionButton, { backgroundColor: colors.success }]}
                    activeOpacity={0.7}
                  >
                    <IconCheck size={14} color="#ffffff" />
                    <ThemedText style={[styles.statusActionText, { color: "#ffffff" }]}>
                      Finalizar
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Origin */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>
                <IconArrowBack size={14} color={colors.mutedForeground} /> Origem
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {CUT_ORIGIN_LABELS[cut.origin as CUT_ORIGIN]}
              </ThemedText>
            </View>

            {/* Type */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>
                <IconHash size={14} color={colors.mutedForeground} /> Tipo
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {CUT_TYPE_LABELS[cut.type as CUT_TYPE]}
              </ThemedText>
            </View>

            {/* Duration */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>
                <IconClock size={14} color={colors.mutedForeground} /> Tempo
              </ThemedText>
              <ThemedText style={styles.detailValue}>
                {getDuration() || "Não iniciado"}
              </ThemedText>
            </View>

            {/* Recut Reason */}
            {cut.reason && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  <IconAlertCircle size={14} color={colors.destructive} /> Motivo
                </ThemedText>
                <ThemedText style={[styles.detailValue, { color: colors.destructive }]}>
                  {CUT_REQUEST_REASON_LABELS[cut.reason as CUT_REQUEST_REASON]}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* File Section */}
        {cut.file && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconFile size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Arquivo de Corte</ThemedText>
            </View>
            <View style={styles.fileContainer}>
              <FileItem
                file={cut.file}
                viewMode="grid"
                baseUrl={process.env.EXPO_PUBLIC_API_URL}
                onPress={() => fileViewer.actions.viewFile(cut.file)}
              />
            </View>
          </Card>
        )}

        {/* Parent Cut (if recut) */}
        {cut.parentCut && (
          <Card style={[styles.card, { backgroundColor: colors.warning + "10", borderColor: colors.warning, borderWidth: 1 }]}>
            <View style={styles.sectionHeader}>
              <IconReload size={20} color={colors.warning} />
              <ThemedText style={[styles.sectionTitle, { color: colors.warning }]}>Este é um Retrabalho</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.relatedCutItem}
              onPress={() => router.push(`/producao/recorte/plano-de-recorte/detalhes/${cut.parentCut!.id}`)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.relatedCutName}>
                  {cut.parentCut.file?.filename || "Recorte Original"}
                </ThemedText>
                <ThemedText style={styles.relatedCutDate}>
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
            <View style={styles.sectionHeader}>
              <IconClipboardList size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Informações da Tarefa</ThemedText>
              <TouchableOpacity
                onPress={() => router.push(`/producao/cronograma/detalhes/${cut.task!.id}`)}
                style={styles.viewDetailsButton}
                activeOpacity={0.7}
              >
                <IconExternalLink size={14} color={colors.primary} />
                <ThemedText style={[styles.viewDetailsText, { color: colors.primary }]}>Ver detalhes</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Nome</ThemedText>
                <ThemedText style={styles.detailValue} numberOfLines={2}>
                  {cut.task.name}
                </ThemedText>
              </View>

              {cut.task.customer && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    <IconUser size={14} color={colors.mutedForeground} /> Cliente
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {cut.task.customer.fantasyName}
                  </ThemedText>
                </View>
              )}

              {cut.task.sector && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    <IconBuildingFactory size={14} color={colors.mutedForeground} /> Setor
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {cut.task.sector.name}
                  </ThemedText>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Dates Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <IconClock size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Datas</ThemedText>
          </View>
          <View style={styles.itemDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Criado em</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(cut.createdAt)}
              </ThemedText>
            </View>

            {cut.startedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Iniciado em</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(cut.startedAt)}
                </ThemedText>
              </View>
            )}

            {cut.completedAt && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Concluído em</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(cut.completedAt)}
                </ThemedText>
              </View>
            )}
          </View>
        </Card>

        {/* Child Cuts (Recuts) Section */}
        {cut.childCuts && cut.childCuts.length > 0 && (
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <IconReload size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>Retrabalhos Realizados</ThemedText>
              <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                {cut.childCuts.length}
              </Badge>
            </View>
            <View style={styles.itemDetails}>
              {cut.childCuts.map((childCut: any) => (
                <TouchableOpacity
                  key={childCut.id}
                  style={styles.relatedCutItem}
                  onPress={() => router.push(`/producao/recorte/plano-de-recorte/detalhes/${childCut.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs }}>
                      <ThemedText style={styles.relatedCutName}>
                        {childCut.file?.filename || "Recorte"}
                      </ThemedText>
                      <Badge variant={getStatusBadgeVariant(childCut.status as CUT_STATUS)}>
                        {CUT_STATUS_LABELS[childCut.status as CUT_STATUS]}
                      </Badge>
                    </View>
                    {childCut.reason && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IconAlertCircle size={12} color={colors.destructive} />
                        <ThemedText style={[styles.relatedCutDate, { color: colors.destructive }]}>
                          {CUT_REQUEST_REASON_LABELS[childCut.reason as CUT_REQUEST_REASON]}
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText style={styles.relatedCutDate}>
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
          <View style={styles.sectionHeader}>
            <IconHistory size={20} color={colors.primary} />
            <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
          </View>
          <View style={{ paddingHorizontal: spacing.md }}>
            <ChangelogTimeline
              entityType={CHANGE_LOG_ENTITY_TYPE.CUT}
              entityId={cut.id}
              entityName={cut.file?.filename || "Plano de Recorte"}
              entityCreatedAt={cut.createdAt}
              maxHeight={400}
            />
          </View>
        </Card>

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
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
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
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  itemDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    width: 100,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: "400",
    flex: 1,
  },
  fileContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  relatedCutItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  relatedCutName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  relatedCutDate: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  viewDetailsText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusActionText: {
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
});
