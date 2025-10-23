import React, { useState, useEffect } from "react";
import { View, ScrollView, RefreshControl, Alert , StyleSheet} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ui/themed-text";
import { IconButton, IconButtonWithLabel } from "@/components/ui/icon-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations, useLayoutsByTruck, useCutsByTask } from '../../../../../hooks';
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { TASK_STATUS, SECTOR_PRIVILEGES, TASK_STATUS_LABELS, CHANGE_LOG_ENTITY_TYPE } from '../../../../../constants';
import { hasPrivilege, formatCurrency, formatDate } from '../../../../../utils';
import { useMemo } from "react";
import { showToast } from "@/components/ui/toast";
import { TaskInfoCard } from "@/components/production/task/detail/task-info-card";
import { TaskDatesCard } from "@/components/production/task/detail/task-dates-card";
import { TaskServicesCard } from "@/components/production/task/detail/task-services-card";
import { TaskCustomerCard } from "@/components/production/task/detail/task-customer-card";
import { TaskPaintCard } from "@/components/production/task/detail/task-paint-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, getBadgeVariantFromStatus } from "@/components/ui/badge";
import { TouchableOpacity } from "react-native";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { FileItem, FilePreviewModal, useFileViewer, type FileViewMode } from "@/components/file";
import {
  IconTruck,
  IconPaint,
  IconFileText,
  IconLink,
  IconCalendarEvent,
  IconLicense,
  IconClipboardList,
  IconEdit,
  IconTrash,
  IconCut,
  IconHistory,
  IconFiles,
  IconLayoutGrid,
  IconList,
  IconDownload,
  IconCurrencyReal,
  IconFile
} from "@tabler/icons-react-native";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { update, delete: deleteAsync } = useTaskMutations();
  const [refreshing, setRefreshing] = useState(false);
  const [artworksViewMode, setArtworksViewMode] = useState<FileViewMode>("grid");
  const [documentsViewMode, setDocumentsViewMode] = useState<FileViewMode>("grid");
  const [cutsViewMode, setCutsViewMode] = useState<FileViewMode>("grid");

  // Storage keys for view preferences
  const STORAGE_KEYS = {
    ARTWORKS_VIEW: "@task_detail_artworks_view",
    DOCUMENTS_VIEW: "@task_detail_documents_view",
    CUTS_VIEW: "@task_detail_cuts_view",
  };

  // Get file viewer context
  const fileViewer = useFileViewer();

  // Load saved view preferences on mount
  useEffect(() => {
    const loadViewPreferences = async () => {
      try {
        const [artworksView, documentsView, cutsView] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ARTWORKS_VIEW),
          AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS_VIEW),
          AsyncStorage.getItem(STORAGE_KEYS.CUTS_VIEW),
        ]);

        if (artworksView) setArtworksViewMode(artworksView as FileViewMode);
        if (documentsView) setDocumentsViewMode(documentsView as FileViewMode);
        if (cutsView) setCutsViewMode(cutsView as FileViewMode);
      } catch (error) {
        console.error("Error loading view preferences:", error);
      }
    };

    loadViewPreferences();
  }, []);

  // Save view preference helper functions
  const saveArtworksViewMode = async (mode: FileViewMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ARTWORKS_VIEW, mode);
      setArtworksViewMode(mode);
    } catch (error) {
      console.error("Error saving artworks view preference:", error);
      setArtworksViewMode(mode); // Still update the UI even if save fails
    }
  };

  const saveDocumentsViewMode = async (mode: FileViewMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS_VIEW, mode);
      setDocumentsViewMode(mode);
    } catch (error) {
      console.error("Error saving documents view preference:", error);
      setDocumentsViewMode(mode);
    }
  };

  const saveCutsViewMode = async (mode: FileViewMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUTS_VIEW, mode);
      setCutsViewMode(mode);
    } catch (error) {
      console.error("Error saving cuts view preference:", error);
      setCutsViewMode(mode);
    }
  };

  // Check permissions
  const canEdit = hasPrivilege(user, SECTOR_PRIVILEGES.WAREHOUSE);
  const canDelete = hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Check if user is from Financial sector
  const isFinancialSector = user ? hasPrivilege(user, SECTOR_PRIVILEGES.FINANCIAL) && user.sector?.privileges === SECTOR_PRIVILEGES.FINANCIAL : false;

  // Check if user is from Warehouse sector (should hide documents, budgets, and changelog)
  const isWarehouseSector = user?.sector?.privileges === SECTOR_PRIVILEGES.WAREHOUSE;

  // Fetch task details
  const { data: response, isLoading, error, refetch } = useTaskDetail(id as string, {
    include: {
      customer: true,
      sector: true,
      services: true,
      artworks: true,
      budgets: true,
      invoices: true,
      receipts: true,
      budget: true,
      truck: {
        include: {
          garage: true,
        },
      },
      generalPainting: true,
      logoPaints: true,
      relatedTasks: {
        include: {
          customer: true,
        },
      },
      relatedTo: {
        include: {
          customer: true,
        },
      },
      createdBy: true,
    },
  });

  const task = response?.data;

  // Fetch cuts related to this task
  const { data: cutsResponse, refetch: refetchCuts } = useCutsByTask(
    {
      taskId: id as string,
      filters: {
        include: {
          file: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    {
      enabled: !!id,
    },
  );

  const cuts = cutsResponse?.data || [];

  // Fetch layouts for truck dimensions
  const { data: layouts, refetch: refetchLayouts } = useLayoutsByTruck((task as any)?.truck?.id || '', {
    enabled: !!(task as any)?.truck?.id,
  });

  // Calculate truck dimensions from any available layout
  const truckDimensions = useMemo(() => {
    if (!layouts) return null;

    const layout = layouts.leftSideLayout || layouts.rightSideLayout || layouts.backSideLayout;
    if (!layout) return null;

    const height = Math.round(layout.height * 100); // Convert to cm and round
    const sections = layout.layoutSections;
    const totalWidth = Math.round(sections.reduce((sum: number, s: any) => sum + s.width * 100, 0));

    return { width: totalWidth, height };
  }, [layouts]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch all data in parallel
      await Promise.all([
        refetch(),
        refetchCuts(),
        refetchLayouts ? refetchLayouts() : Promise.resolve()
      ]);
      showToast({ message: "Detalhes atualizados", type: "success" });
    } catch (error) {
      showToast({ message: "Erro ao atualizar dados", type: "error" });
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      showToast({ message: "Você não tem permissão para editar", type: "error" });
      return;
    }
    router.push(`/production/schedule/edit/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      showToast({ message: "Você não tem permissão para excluir", type: "error" });
      return;
    }

    Alert.alert(
      "Excluir Tarefa",
      "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAsync(id as string);
              showToast({ message: "Tarefa excluída com sucesso", type: "success" });
              router.back();
            } catch (error) {
              showToast({ message: "Erro ao excluir tarefa", type: "error" });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes da tarefa..." />;
  }

  if (error || !task) {
    return (
      <ErrorScreen
        message="Erro ao carregar detalhes da tarefa"
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

          {/* Task Name Header Card */}
          <Card>
            <CardContent style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <ThemedText style={StyleSheet.flatten([styles.taskTitle, { color: colors.foreground }])} numberOfLines={2}>
                  {task.name}
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

          {/* Overview Card - Informações Gerais */}
          <TaskInfoCard task={task} truckDimensions={truckDimensions} />

          {/* Dates Card - Datas */}
          <TaskDatesCard task={task} />

          {/* Customer Card */}
          {task.customer && <TaskCustomerCard customer={task.customer} />}

          {/* Services */}
          {task.services && task.services.length > 0 && (
            <TaskServicesCard services={task.services} />
          )}

          {/* Paints - Tintas */}
          {((task as any)?.generalPainting || ((task as any)?.logoPaints && (task as any).logoPaints.length > 0)) && (
            <TaskPaintCard
              generalPainting={(task as any)?.generalPainting}
              logoPaints={(task as any)?.logoPaints}
              onPaintPress={(paintId) => {
                // Navigate to paint details
                router.push(`/(tabs)/painting/catalog/details/${paintId}`);
              }}
            />
          )}

          {/* Artworks Section */}
          {(task as any)?.artworks && (task as any).artworks.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconFiles size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Artes</ThemedText>
                <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                  {(task as any).artworks.length}
                </Badge>
              </View>
              <View style={styles.viewModeControls}>
                {(task as any).artworks.length > 1 && (
                  <TouchableOpacity
                    style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      for (const file of (task as any).artworks) {
                        try {
                          await fileViewer.actions.downloadFile(file);
                        } catch (error) {
                          console.error("Error downloading file:", error);
                        }
                      }
                      showToast({ message: `${(task as any).artworks.length} arquivos baixados`, type: "success" });
                    }}
                    activeOpacity={0.7}
                  >
                    <IconDownload size={16} color={colors.primaryForeground} />
                    <ThemedText style={[styles.downloadAllText, { color: colors.primaryForeground }]}>
                      Baixar Todos
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <View style={styles.viewModeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: artworksViewMode === "list" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveArtworksViewMode("list")}
                    activeOpacity={0.7}
                  >
                    <IconList size={16} color={artworksViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: artworksViewMode === "grid" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveArtworksViewMode("grid")}
                    activeOpacity={0.7}
                  >
                    <IconLayoutGrid size={16} color={artworksViewMode === "grid" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={artworksViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                {(task as any).artworks.map((file: any, index: number) => (
                  <FileItem
                    key={`artwork-${index}-${file.id}`}
                    file={file}
                    viewMode={artworksViewMode}
                    baseUrl={process.env.EXPO_PUBLIC_API_URL}
                    onPress={() => {
                      fileViewer.actions.viewFiles((task as any).artworks, index);
                    }}
                    showFilename={true}
                    showFileSize={true}
                    showRelativeTime={false}
                  />
                ))}
              </View>
            </Card>
          )}

          {/* Documents Section - Hidden for Warehouse sector users */}
          {!isWarehouseSector && ((task as any)?.budgets || (task as any)?.invoices || (task as any)?.receipts) && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconFileText size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Documentos</ThemedText>
                <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                  {[...((task as any).budgets || []), ...((task as any).invoices || []), ...((task as any).receipts || [])].length}
                </Badge>
              </View>
              <View style={styles.viewModeControls}>
                <View style={styles.viewModeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: documentsViewMode === "list" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveDocumentsViewMode("list")}
                    activeOpacity={0.7}
                  >
                    <IconList size={16} color={documentsViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: documentsViewMode === "grid" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveDocumentsViewMode("grid")}
                    activeOpacity={0.7}
                  >
                    <IconLayoutGrid size={16} color={documentsViewMode === "grid" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Budgets */}
              {(task as any).budgets && (task as any).budgets.length > 0 && (
                <View style={styles.documentSection}>
                  <View style={styles.documentSectionHeader}>
                    <IconCurrencyReal size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.documentSectionTitle}>Orçamentos</ThemedText>
                  </View>
                  <View style={documentsViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                    {(task as any).budgets.map((file: any, index: number) => (
                      <FileItem
                        key={`budget-${index}-${file.id}`}
                        file={file}
                        viewMode={documentsViewMode}
                        baseUrl={process.env.EXPO_PUBLIC_API_URL}
                        onPress={() => {
                          const budgetFiles = (task as any).budgets;
                          fileViewer.actions.viewFiles(budgetFiles, index);
                        }}
                        showFilename={true}
                        showFileSize={true}
                        showRelativeTime={false}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Invoices */}
              {(task as any).invoices && (task as any).invoices.length > 0 && (
                <View style={styles.documentSection}>
                  <View style={styles.documentSectionHeader}>
                    <IconFileText size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.documentSectionTitle}>Notas Fiscais</ThemedText>
                  </View>
                  <View style={documentsViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                    {(task as any).invoices.map((file: any, index: number) => (
                      <FileItem
                        key={`invoice-${index}-${file.id}`}
                        file={file}
                        viewMode={documentsViewMode}
                        baseUrl={process.env.EXPO_PUBLIC_API_URL}
                        onPress={() => {
                          const invoiceFiles = (task as any).invoices;
                          fileViewer.actions.viewFiles(invoiceFiles, index);
                        }}
                        showFilename={true}
                        showFileSize={true}
                        showRelativeTime={false}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Receipts */}
              {(task as any).receipts && (task as any).receipts.length > 0 && (
                <View style={styles.documentSection}>
                  <View style={styles.documentSectionHeader}>
                    <IconFile size={16} color={colors.mutedForeground} />
                    <ThemedText style={styles.documentSectionTitle}>Recibos</ThemedText>
                  </View>
                  <View style={documentsViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                    {(task as any).receipts.map((file: any, index: number) => (
                      <FileItem
                        key={`receipt-${index}-${file.id}`}
                        file={file}
                        viewMode={documentsViewMode}
                        baseUrl={process.env.EXPO_PUBLIC_API_URL}
                        onPress={() => {
                          const receiptFiles = (task as any).receipts;
                          fileViewer.actions.viewFiles(receiptFiles, index);
                        }}
                        showFilename={true}
                        showFileSize={true}
                        showRelativeTime={false}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Related Tasks */}
          {((task as any)?.relatedTasks?.length > 0 || (task as any)?.relatedTo?.length > 0) && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconLink size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Tarefas Relacionadas</ThemedText>
              </View>
              <View style={styles.itemDetails}>
                {(task as any).relatedTasks?.map((relatedTask: any) => (
                  <View key={relatedTask.id} style={styles.relatedTaskItem}>
                    <ThemedText style={styles.relatedTaskName}>
                      {relatedTask.name}
                    </ThemedText>
                    {relatedTask.customer && (
                      <ThemedText style={styles.relatedTaskCustomer}>
                        {relatedTask.customer.fantasyName}
                      </ThemedText>
                    )}
                  </View>
                ))}
                {(task as any).relatedTo?.map((relatedTask: any) => (
                  <View key={relatedTask.id} style={styles.relatedTaskItem}>
                    <ThemedText style={styles.relatedTaskName}>
                      {relatedTask.name}
                    </ThemedText>
                    {relatedTask.customer && (
                      <ThemedText style={styles.relatedTaskCustomer}>
                        {relatedTask.customer.fantasyName}
                      </ThemedText>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}


          {/* Financial summary - Hidden for Warehouse sector users */}
          {!isWarehouseSector && task.price && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Valor Total</ThemedText>
              </View>
              <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.primary }])}>
                {formatCurrency(task.price)}
              </ThemedText>
            </Card>
          )}

          {/* Cuts Card - Hidden for Financial sector users */}
          {!isFinancialSector && cuts.length > 0 && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconCut size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Recortes</ThemedText>
                <Badge variant="secondary" style={{ marginLeft: spacing.sm }}>
                  {cuts.length}
                </Badge>
              </View>
              <View style={styles.viewModeControls}>
                {cuts.length > 1 && (
                  <TouchableOpacity
                    style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
                    onPress={async () => {
                      for (const cut of cuts) {
                        if (cut.file) {
                          try {
                            await fileViewer.actions.downloadFile(cut.file);
                          } catch (error) {
                            console.error("Error downloading file:", error);
                          }
                        }
                      }
                      showToast({ message: `${cuts.length} arquivos baixados`, type: "success" });
                    }}
                    activeOpacity={0.7}
                  >
                    <IconDownload size={16} color={colors.primaryForeground} />
                    <ThemedText style={[styles.downloadAllText, { color: colors.primaryForeground }]}>
                      Baixar Todos
                    </ThemedText>
                  </TouchableOpacity>
                )}
                <View style={styles.viewModeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: cutsViewMode === "list" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveCutsViewMode("list")}
                    activeOpacity={0.7}
                  >
                    <IconList size={16} color={cutsViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.viewModeButton,
                      { backgroundColor: cutsViewMode === "grid" ? colors.primary : colors.muted }
                    ]}
                    onPress={() => saveCutsViewMode("grid")}
                    activeOpacity={0.7}
                  >
                    <IconLayoutGrid size={16} color={cutsViewMode === "grid" ? colors.primaryForeground : colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={cutsViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                {cuts.map((cut: any, index: number) =>
                  cut.file ? (
                    <FileItem
                      key={`cut-${cut.id}-${index}`}
                      file={cut.file}
                      viewMode={cutsViewMode}
                      baseUrl={process.env.EXPO_PUBLIC_API_URL}
                      onPress={() => {
                        const cutFiles = cuts.map(c => c.file).filter(Boolean);
                        fileViewer.actions.viewFiles(cutFiles, index);
                      }}
                      showFilename={true}
                      showFileSize={true}
                      showRelativeTime={false}
                    />
                  ) : null
                )}
              </View>
            </Card>
          )}

          {/* Changelog History - Hidden for Financial and Warehouse sector users */}
          {!isFinancialSector && !isWarehouseSector && (
            <Card style={styles.card}>
              <View style={styles.sectionHeader}>
                <IconHistory size={20} color={colors.primary} />
                <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
              </View>
              <View style={{ paddingHorizontal: spacing.md }}>
                <ChangelogTimeline
                  entityType={CHANGE_LOG_ENTITY_TYPE.TASK}
                  entityId={task.id}
                  entityName={task.name}
                  entityCreatedAt={task.createdAt}
                  maxHeight={400}
                />
              </View>
            </Card>
          )}

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>

        {/* File Preview Modal */}
        <FilePreviewModal
          files={fileViewer.state.currentFiles}
          initialFileIndex={fileViewer.state.currentFileIndex}
          visible={fileViewer.state.isPreviewModalOpen}
          onClose={fileViewer.actions.closePreview}
          baseUrl={process.env.EXPO_PUBLIC_API_URL}
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
  itemDetails: {
    gap: spacing.sm,
  },
  relatedTaskItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  relatedTaskName: {
    fontSize: fontSize.md,
    fontWeight: "500",
  },
  relatedTaskCustomer: {
    fontSize: fontSize.sm,
    opacity: 0.7,
    marginTop: 2,
  },
  summaryValue: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  downloadAllText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  viewModeControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  viewModeButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
  },
  documentSection: {
    marginTop: spacing.md,
  },
  documentSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  documentSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
