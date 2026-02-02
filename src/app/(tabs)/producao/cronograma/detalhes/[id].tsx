import { useState, useEffect, useRef, useMemo } from "react";
import type { FileViewMode } from "@/components/file";
import { View, ScrollView, RefreshControl, Alert, StyleSheet, InteractionManager, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { SkeletonCard, SkeletonText, SkeletonListItem } from "@/components/ui/skeleton-card";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/contexts/auth-context";
import { useTaskDetail, useTaskMutations, useLayoutsByTruck, useScreenReady } from "@/hooks";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { SECTOR_PRIVILEGES } from "@/constants";
import { hasPrivilege, formatCurrency, formatDate, isTeamLeader } from "@/utils";
import { perfLog } from "@/utils/performance-logger";
import { useScreenPerformance } from "@/utils/screen-performance-monitor";
import { apiPerformanceLogger } from "@/utils/api-performance-logger";
// import { showToast } from "@/components/ui/toast";
import { TaskInfoCard } from "@/components/production/task/detail/task-info-card";
import { TaskDatesCard } from "@/components/production/task/detail/task-dates-card";
import { TruckLayoutPreview } from "@/components/production/layout/truck-layout-preview";

import { TaskGeneralPaintCard } from "@/components/production/task/detail/task-general-paint-card";
import { TaskLogoPaintsCard } from "@/components/production/task/detail/task-logo-paints-card";
import { TaskGroundPaintsCard } from "@/components/production/task/detail/task-ground-paints-card";
import { ObservationsTable } from "@/components/production/task/detail/observations-table";
import { CutsTable } from "@/components/production/task/detail/cuts-table";
import { TaskServicesCard } from "@/components/production/task/detail/task-services-card";
import { TaskPricingCard } from "@/components/production/task/detail/task-pricing-card";
import { AirbrushingsTable } from "@/components/production/task/detail/airbrushings-table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskWithServiceOrdersChangelog } from "@/components/ui/task-with-service-orders-changelog";
import { FileItem, useFileViewer} from "@/components/file";
import {
  IconFileText,
  IconCalendarEvent,
  IconEdit,
  IconTrash,
  IconHistory,
  IconFiles,
  IconLayoutGrid,
  IconList,
  IconCurrencyReal,
  IconFile,
  IconAlertCircle,
  IconDownload,
} from "@tabler/icons-react-native";

export default function ScheduleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { delete: deleteAsync } = useTaskMutations();
  const [refreshing, setRefreshing] = useState(false);
  const [baseFilesViewMode, setBaseFilesViewMode] = useState<FileViewMode>("list");
  const [artworksViewMode, setArtworksViewMode] = useState<FileViewMode>("list");
  const [documentsViewMode, setDocumentsViewMode] = useState<FileViewMode>("list");

  // Track screen performance
  const { trackDataLoaded, trackRenderComplete } = useScreenPerformance('ScheduleDetailsScreen');

  // End navigation loading overlay when screen mounts
  useScreenReady();

  // Performance logging - track screen mount
  const mountTime = useRef(performance.now());
  useEffect(() => {
    perfLog.screenMount('ScheduleDetailsScreen');
    perfLog.mark(`Task detail screen mounted for id: ${id}`);
    console.log(`📱 [SCREEN] ScheduleDetailsScreen mounted for task: ${id}`);
  }, []);

  // Get file viewer context
  const fileViewer = useFileViewer();

  // Check permissions - Use exact privilege checks (matching web task-edit-form.tsx)
  const userPrivilege = user?.sector?.privileges;

  // Individual sector checks
  const isAdminUser = userPrivilege === SECTOR_PRIVILEGES.ADMIN;
  const isFinancialUser = userPrivilege === SECTOR_PRIVILEGES.FINANCIAL;
  const isCommercialUser = userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL;
  const isDesignerUser = userPrivilege === SECTOR_PRIVILEGES.DESIGNER;
  const isLogisticUser = userPrivilege === SECTOR_PRIVILEGES.LOGISTIC;
  const isWarehouseUser = userPrivilege === SECTOR_PRIVILEGES.WAREHOUSE;
  const isProductionUser = userPrivilege === SECTOR_PRIVILEGES.PRODUCTION;
  const isPlottingUser = userPrivilege === SECTOR_PRIVILEGES.PLOTTING;

  // ADMIN, COMMERCIAL, DESIGNER, FINANCIAL, LOGISTIC can edit tasks (matches canEditTasks in entity-permissions.ts)
  const canEdit = isAdminUser || isCommercialUser || isDesignerUser || isFinancialUser || isLogisticUser;
  const canDelete = isAdminUser;

  // Check if user can view documents (admin/financial only) - matches web canViewFinancialSections
  const canViewDocuments = isAdminUser || isFinancialUser;

  // Check if user can view base files (ADMIN, COMMERCIAL, LOGISTIC, DESIGNER only) - matches web
  const canViewBaseFiles = isAdminUser || isCommercialUser || isLogisticUser || isDesignerUser;

  // Check if user can view artwork badges and non-approved artworks (admin/commercial/financial/logistic/designer only)
  const canViewArtworkBadges = isAdminUser || isCommercialUser || isFinancialUser || isLogisticUser || isDesignerUser;

  // Check if user can view artworks section - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC (matches web)
  const canViewArtworks = !isWarehouseUser && !isFinancialUser && !isLogisticUser;

  // Check if user can view truck layout (admin/commercial/designer/financial/logistic/production manager only)
  const canViewTruckLayout = isAdminUser || isCommercialUser || isDesignerUser || isFinancialUser || isLogisticUser || (isProductionUser && isTeamLeader(user));

  // Check if user can view financial fields (invoiceTo, commission) - ADMIN, FINANCIAL, COMMERCIAL only
  const canViewFinancialFields = isAdminUser || isFinancialUser || isCommercialUser;

  // Check if user can view restricted fields (negotiatingWith, forecastDate) - ADMIN, FINANCIAL, COMMERCIAL, LOGISTIC, DESIGNER only (matches web)
  const canViewRestrictedFields = isAdminUser || isFinancialUser || isCommercialUser || isLogisticUser || isDesignerUser;

  // Check if user can view pricing section - ADMIN, FINANCIAL, COMMERCIAL only (matches web canViewPricingSections)
  const canViewPricingSection = isAdminUser || isFinancialUser || isCommercialUser;

  // Paint sections - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC (matches web)
  const canViewPaintSections = !isWarehouseUser && !isFinancialUser && !isLogisticUser;

  // Logo paints - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC, COMMERCIAL (matches web)
  const canViewLogoPaints = !isWarehouseUser && !isFinancialUser && !isLogisticUser && !isCommercialUser;

  // Observation section - Hidden from WAREHOUSE, FINANCIAL, DESIGNER, LOGISTIC, COMMERCIAL (matches web)
  const canViewObservation = !isWarehouseUser && !isFinancialUser && !isDesignerUser && !isLogisticUser && !isCommercialUser;

  // Cuts section - Hidden from FINANCIAL, LOGISTIC, COMMERCIAL (matches web)
  const canViewCuts = !isFinancialUser && !isLogisticUser && !isCommercialUser;

  // Airbrushing section - Hidden from WAREHOUSE, FINANCIAL, DESIGNER, LOGISTIC, COMMERCIAL (matches web)
  const canViewAirbrushing = !isWarehouseUser && !isFinancialUser && !isDesignerUser && !isLogisticUser && !isCommercialUser;

  // SINGLE OPTIMIZED INCLUDE - Only fetch what's needed
  const taskInclude = useMemo(() => ({
    // Core data - always needed
    sector: true,
    customer: true,
    createdBy: true,
    truck: true,
    serviceOrders: {
      select: {
        id: true,
        description: true,
        status: true,
        type: true,
        statusOrder: true,
        assignedToId: true,
      }
    },

    // Representatives - only for users with restricted fields access
    ...(canViewRestrictedFields && {
      representatives: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
        }
      }
    }),

    // Only include what user can view - reduces payload
    ...(canViewObservation && {
      observation: { select: { id: true, description: true } }
    }),

    ...(canViewBaseFiles && {
      baseFiles: {
        select: { id: true, filename: true, size: true, mimetype: true },
        take: 20 // Limit initial files
      }
    }),

    ...(canViewArtworks && {
      artworks: {
        select: { id: true, file: { select: { id: true, filename: true } } },
        take: 20 // Limit initial artworks
      }
    }),

    ...(canViewPricingSection && {
      pricing: {
        select: {
          id: true,
          total: true,
          status: true,
          items: { take: 10 } // Limit items
        }
      }
    }),

    ...(canViewPaintSections && {
      generalPainting: true
    }),

    ...(canViewLogoPaints && {
      logoPaints: { take: 10 }
    }),
  }), [
    canViewRestrictedFields,
    canViewObservation,
    canViewBaseFiles,
    canViewArtworks,
    canViewPricingSection,
    canViewPaintSections,
    canViewLogoPaints
  ]);

  // SINGLE OPTIMIZED API CALL - Much faster!
  const { data: response, isLoading, error, refetch } = useTaskDetail(id as string, {
    include: taskInclude,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  const task = response?.data;

  // Performance logging - track when data is ready
  useEffect(() => {
    if (!isLoading && task) {
      perfLog.dataReady('ScheduleDetailsScreen', 'useTaskDetail');
      perfLog.mark(`Task data loaded: ${task.name || task.id}`);

      // Track data loaded with API details
      const apiSummary = apiPerformanceLogger.getSummary();
      trackDataLoaded({
        url: `/tasks/${id}`,
        duration: apiSummary.averageDuration,
        size: JSON.stringify(task).length,
      });
    }
  }, [isLoading, task, id, trackDataLoaded]);

  // Get display name with fallbacks
  const getTaskDisplayName = (task: any) => {
    if (task.name) return task.name;
    if (task.customer?.fantasyName) return task.customer.fantasyName;
    if (task.serialNumber) return `Série ${task.serialNumber}`;
    if ((task as any).truck?.plate) return (task as any).truck.plate;
    return "Sem nome";
  };

  const taskDisplayName = task ? getTaskDisplayName(task) : "Carregando...";

  // Fetch layouts for truck dimensions - load in parallel with phase 1
  const { data: layouts, isLoading: layoutsLoading } = useLayoutsByTruck((task as any)?.truck?.id || '', {
    include: { layoutSections: true },
    enabled: !!(task as any)?.truck?.id,
  });

  // Calculate truck dimensions from any available layout
  const truckDimensions = useMemo(() => {
    if (!layouts) return null;

    const layout = layouts.leftSideLayout || layouts.rightSideLayout || layouts.backSideLayout;
    if (!layout) return null;

    const height = Math.round(layout.height * 100); // Convert to cm and round
    const sections = layout.layoutSections;
    const totalWidth = Math.round(sections?.reduce((sum: number, s: any) => sum + s.width * 100, 0) || 0);

    return { width: totalWidth, height };
  }, [layouts]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    Alert.alert("Sucesso", "Detalhes atualizados");
  };

  // Handle edit
  const handleEdit = () => {
    if (!canEdit) {
      Alert.alert("Erro", "Você não tem permissão para editar");
      return;
    }
    router.push(`/producao/cronograma/editar/${id}`);
  };

  // Handle delete
  const handleDelete = () => {
    if (!canDelete) {
      Alert.alert("Erro", "Você não tem permissão para excluir");
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
              // API client already shows success alert
              router.back();
            } catch (_error) {
              // API client already shows error alert
            }
          },
        },
      ]
    );
  };

  // Performance logging - track when screen content is rendered
  useEffect(() => {
    if (!isLoading && task) {
      // Use requestAnimationFrame to measure after paint
      requestAnimationFrame(() => {
        perfLog.screenRendered('ScheduleDetailsScreen');
        perfLog.getSummary();
        trackRenderComplete();

        // Log API performance summary after render
        console.log('📊 [API SUMMARY FOR THIS SCREEN]');
        apiPerformanceLogger.logSummary();
      });
    }
  }, [isLoading, task, trackRenderComplete]);

  if (isLoading) {
    perfLog.mark('Showing skeleton screen for ScheduleDetailsScreen');
    // Show skeleton instead of blank loading screen
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header skeleton */}
          <SkeletonCard height={80} style={{ marginBottom: 16 }} />

          {/* Info card skeleton */}
          <SkeletonCard height={200} style={{ marginBottom: 16 }} />

          {/* Dates card skeleton */}
          <SkeletonCard height={150} style={{ marginBottom: 16 }} />

          {/* Services skeleton */}
          <SkeletonCard height={300} style={{ marginBottom: 16 }} />

          {/* Additional sections */}
          <SkeletonCard height={200} style={{ marginBottom: 16 }} />
          <SkeletonCard height={250} />
        </View>
      </ScrollView>
    );
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
    <>
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
          <Card style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <ThemedText style={StyleSheet.flatten([styles.taskTitle, { color: colors.foreground }])} numberOfLines={2}>
                  {taskDisplayName}
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
            </View>
          </Card>

          {/* Overview Card - Informações Gerais */}
          <TaskInfoCard task={{
            ...task,
            truck: task.truck,
            customer: task.customer,
            representatives: (task as any).representatives,
            details: task.details ?? "",
          }} truckDimensions={truckDimensions} canViewFinancialFields={canViewFinancialFields} canViewRestrictedFields={canViewRestrictedFields} />

          {/* Dates Card - Datas */}
          <TaskDatesCard task={{
            ...task,
            entryDate: task.entryDate ?? new Date(),
            term: task.term ?? new Date(),
            createdBy: task.createdBy,
          }} canViewRestrictedFields={canViewRestrictedFields} />

          {/* Truck Layout - Only for Admin, Logistic, and Leader */}
          {canViewTruckLayout && (task as any)?.truck && layouts && (layouts.leftSideLayout || layouts.rightSideLayout || layouts.backSideLayout) && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconLayoutGrid size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Layout do Caminhão</ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <TruckLayoutPreview truckId={(task as any).truck.id} taskName={taskDisplayName} />
              </View>
            </Card>
          )}

          {/* Services */}
          {task.serviceOrders && task.serviceOrders.length > 0 && (
            <TaskServicesCard services={task.serviceOrders} taskSectorId={task.sectorId} />
          )}

          {/* Pricing Card - Only visible to ADMIN, FINANCIAL, and COMMERCIAL sectors */}
          {canViewPricingSection && (task as any)?.pricing && (task as any).pricing.items && (task as any).pricing.items.length > 0 && (
            <TaskPricingCard
              pricing={(task as any).pricing}
              customerId={task.customer?.id}
              customerName={task.customer?.corporateName || task.customer?.fantasyName}
              contactName={(task as any).negotiatingWith?.name}
              termDate={task.term}
            />
          )}

          {/* General Painting - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC (matches web) */}
          {canViewPaintSections && (task as any)?.generalPainting && (
            <TaskGeneralPaintCard
              paint={(task as any).generalPainting}
              onPaintPress={(_paintId) => {
                // Navigate to paint details if needed
                // router.push(`/painting/catalog/details/${paintId}`);
              }}
            />
          )}

          {/* Logo Paints - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC, COMMERCIAL (matches web) */}
          {canViewLogoPaints && (task as any)?.logoPaints && (task as any).logoPaints.length > 0 && (
            <TaskLogoPaintsCard
              paints={(task as any).logoPaints}
              onPaintPress={(_paintId) => {
                // Navigate to paint details if needed
                // router.push(`/painting/catalog/details/${paintId}`);
              }}
            />
          )}

          {/* Ground Paints - Fundos Recomendados - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC (matches web) */}
          {canViewPaintSections && (task as any)?.generalPainting?.paintGrounds &&
           (task as any).generalPainting.paintGrounds.length > 0 && (
            <TaskGroundPaintsCard
              groundPaints={(task as any).generalPainting.paintGrounds.map(
                (pg: any) => pg.groundPaint
              )}
            />
          )}

          {/* Observation Card - Before Artworks - Hidden from WAREHOUSE, FINANCIAL, DESIGNER, LOGISTIC, COMMERCIAL (matches web) */}
          {canViewObservation && (task as any)?.observation && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconAlertCircle size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Observação</ThemedText>
                  {(task as any).observation.files && (task as any).observation.files.length > 0 && (
                    <Badge variant="secondary">
                      {(task as any).observation.files.length}
                    </Badge>
                  )}
                </View>
              </View>
              <View style={styles.sectionContent}>
                <View style={[styles.observationContent, { backgroundColor: colors.mutedForeground + '10', borderRadius: borderRadius.md, padding: spacing.md }]}>
                  <ThemedText style={{ fontSize: fontSize.sm, color: colors.foreground }}>
                    {(task as any).observation.description}
                  </ThemedText>
                </View>

                {(task as any).observation.files && (task as any).observation.files.length > 0 && (
                  <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
                      <IconFiles size={16} color={colors.mutedForeground} />
                      <ThemedText style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>
                        Arquivos Anexados
                      </ThemedText>
                    </View>
                    <View style={styles.gridContainer}>
                      {(task as any).observation.files.map((file: any, index: number) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          viewMode="grid"
                          baseUrl={process.env.EXPO_PUBLIC_API_URL}
                          onPress={() => {
                            fileViewer.actions.viewFiles((task as any).observation.files, index);
                          }}
                          showFilename={false}
                          showFileSize={false}
                          showRelativeTime={false}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Observations Table - Before Artworks - Hidden from WAREHOUSE, FINANCIAL, DESIGNER, LOGISTIC, COMMERCIAL (matches web) */}
          {canViewObservation && <ObservationsTable taskId={id as string} maxHeight={400} />}

          {/* Base Files Section - Only for ADMIN, COMMERCIAL, LOGISTIC, DESIGNER */}
          {canViewBaseFiles && (task as any)?.baseFiles && (task as any).baseFiles.length > 0 && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconFile size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Arquivos Base</ThemedText>
                  <Badge variant="secondary">
                    {(task as any).baseFiles.length}
                  </Badge>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.viewModeControls}>
                  {(task as any).baseFiles.length > 1 && (
                    <TouchableOpacity
                      style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
                      onPress={async () => {
                        for (const file of (task as any).baseFiles) {
                          try {
                            await fileViewer.actions.downloadFile(file);
                          } catch (_error) {
                            console.error("Error downloading file:", _error);
                          }
                        }
                        Alert.alert("Sucesso", `${(task as any).baseFiles.length} arquivos baixados`);
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
                        { backgroundColor: baseFilesViewMode === "list" ? colors.primary : colors.muted }
                      ]}
                      onPress={() => setBaseFilesViewMode("list")}
                      activeOpacity={0.7}
                    >
                      <IconList size={16} color={baseFilesViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.viewModeButton,
                        { backgroundColor: baseFilesViewMode === "grid" ? colors.primary : colors.muted }
                      ]}
                      onPress={() => setBaseFilesViewMode("grid")}
                      activeOpacity={0.7}
                    >
                      <IconLayoutGrid size={16} color={baseFilesViewMode === "grid" ? colors.primaryForeground : colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={baseFilesViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                  {(task as any).baseFiles.map((file: any, index: number) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode={baseFilesViewMode}
                      baseUrl={process.env.EXPO_PUBLIC_API_URL}
                      onPress={() => {
                        fileViewer.actions.viewFiles((task as any).baseFiles, index);
                      }}
                    />
                  ))}
                </View>
              </View>
            </Card>
          )}

          {/* Artworks Section - Hidden from WAREHOUSE, FINANCIAL, LOGISTIC (matches web) */}
          {canViewArtworks && (() => {
            // Filter artworks: show all if user can view badges, otherwise only approved
            const filteredArtworks = (task as any)?.artworks?.filter((artwork: any) =>
              canViewArtworkBadges || artwork.status === 'APPROVED'
            ) || [];

            if (filteredArtworks.length === 0) return null;

            return (
              <Card style={styles.sectionCard}>
                <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.sectionHeaderLeft}>
                    <IconFiles size={20} color={colors.mutedForeground} />
                    <ThemedText style={styles.sectionTitle}>Artes</ThemedText>
                    <Badge variant="secondary">
                      {filteredArtworks.length}
                    </Badge>
                  </View>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.viewModeControls}>
                    {filteredArtworks.length > 1 && (
                      <TouchableOpacity
                        style={[styles.downloadAllButton, { backgroundColor: colors.primary }]}
                        onPress={async () => {
                          for (const file of filteredArtworks) {
                            try {
                              await fileViewer.actions.downloadFile(file);
                            } catch (_error) {
                              console.error("Error downloading file:", error);
                            }
                          }
                          Alert.alert("Sucesso", `${filteredArtworks.length} arquivos baixados`);
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
                        onPress={() => setArtworksViewMode("list")}
                        activeOpacity={0.7}
                      >
                        <IconList size={16} color={artworksViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.viewModeButton,
                          { backgroundColor: artworksViewMode === "grid" ? colors.primary : colors.muted }
                        ]}
                        onPress={() => setArtworksViewMode("grid")}
                        activeOpacity={0.7}
                      >
                        <IconLayoutGrid size={16} color={artworksViewMode === "grid" ? colors.primaryForeground : colors.foreground} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={artworksViewMode === "grid" ? styles.gridContainer : styles.listContainer}>
                    {filteredArtworks.map((artwork: any, index: number) => (
                      <View key={artwork.id} style={styles.artworkItemContainer}>
                        <FileItem
                          file={artwork}
                          viewMode={artworksViewMode}
                          baseUrl={process.env.EXPO_PUBLIC_API_URL}
                          onPress={() => {
                            fileViewer.actions.viewFiles(filteredArtworks, index);
                          }}
                        />
                        {canViewArtworkBadges && artwork.status && (
                          <View style={[styles.artworkBadgeContainer, { backgroundColor: colors.card }]}>
                            <Badge
                              variant={artwork.status === 'APPROVED' ? 'success' : artwork.status === 'REPROVED' ? 'destructive' : 'secondary'}
                            >
                              {artwork.status === 'APPROVED' ? 'Aprovado' : artwork.status === 'REPROVED' ? 'Reprovado' : 'Rascunho'}
                            </Badge>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            );
          })()}

          {/* Documents Section - Only for Admin and Financial */}
          {canViewDocuments && ((task as any)?.budgets || (task as any)?.invoices || (task as any)?.receipts) && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconFileText size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Documentos</ThemedText>
                  <Badge variant="secondary">
                    {[...((task as any).budgets || []), ...((task as any).invoices || []), ...((task as any).receipts || [])].length}
                  </Badge>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.viewModeControls}>
                  <View style={styles.viewModeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.viewModeButton,
                        { backgroundColor: documentsViewMode === "list" ? colors.primary : colors.muted }
                      ]}
                      onPress={() => setDocumentsViewMode("list")}
                      activeOpacity={0.7}
                    >
                      <IconList size={16} color={documentsViewMode === "list" ? colors.primaryForeground : colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.viewModeButton,
                        { backgroundColor: documentsViewMode === "grid" ? colors.primary : colors.muted }
                      ]}
                      onPress={() => setDocumentsViewMode("grid")}
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
                      {(task as any).budgets.map((file: any) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          viewMode={documentsViewMode}
                          baseUrl={process.env.EXPO_PUBLIC_API_URL}
                          onPress={() => fileViewer.actions.viewFile(file)}
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
                      {(task as any).invoices.map((file: any) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          viewMode={documentsViewMode}
                          baseUrl={process.env.EXPO_PUBLIC_API_URL}
                          onPress={() => fileViewer.actions.viewFile(file)}
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
                      {(task as any).receipts.map((file: any) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          viewMode={documentsViewMode}
                          baseUrl={process.env.EXPO_PUBLIC_API_URL}
                          onPress={() => fileViewer.actions.viewFile(file)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Budget Table - Only for Admin and Financial */}
          {canViewDocuments && (task as any)?.budget && (task as any).budget.items && (task as any).budget.items.length > 0 && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconCurrencyReal size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Orçamento Detalhado</ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {/* Budget Expiry Date */}
                {(task as any).budget.expiresIn && (
                  <View style={[styles.budgetExpiryContainer, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <IconCalendarEvent size={16} color={colors.mutedForeground} />
                    <View style={styles.budgetExpiryContent}>
                      <ThemedText style={[styles.budgetExpiryLabel, { color: colors.mutedForeground }]}>
                        Validade do Orçamento
                      </ThemedText>
                      <ThemedText style={[styles.budgetExpiryDate, { color: colors.foreground }]}>
                        {formatDate((task as any).budget.expiresIn)}
                      </ThemedText>
                    </View>
                  </View>
                )}

                {/* Budget Table */}
                <View style={styles.budgetTableContainer}>
                  {/* Table Header */}
                  <View style={[styles.budgetTableHeader, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
                    <ThemedText style={[styles.budgetTableHeaderText, styles.budgetTableDescriptionColumn, { color: colors.foreground }]}>
                      Descrição
                    </ThemedText>
                    <ThemedText style={[styles.budgetTableHeaderText, styles.budgetTableAmountColumn, { color: colors.foreground }]}>
                      Valor
                    </ThemedText>
                  </View>

                  {/* Table Body */}
                  <View style={styles.budgetTableBody}>
                    {(task as any).budget.items.map((item: any, index: number) => (
                      <View
                        key={item.id}
                        style={[
                          styles.budgetTableRow,
                          { borderBottomColor: colors.border },
                          index === (task as any).budget.items.length - 1 && styles.budgetTableRowLast
                        ]}
                      >
                        <ThemedText style={[styles.budgetTableCell, styles.budgetTableDescriptionColumn, { color: colors.foreground }]}>
                          {item.description}
                        </ThemedText>
                        <ThemedText style={[styles.budgetTableCell, styles.budgetTableAmountColumn, { color: colors.foreground }]}>
                          {formatCurrency(item.amount)}
                        </ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Total Row */}
                  <View style={[styles.budgetTotalRow, { backgroundColor: colors.primary + '10', borderTopColor: colors.primary }]}>
                    <ThemedText style={[styles.budgetTotalLabel, { color: colors.foreground }]}>
                      TOTAL
                    </ThemedText>
                    <ThemedText style={[styles.budgetTotalValue, { color: colors.primary }]}>
                      {formatCurrency((task as any).budget.total)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {/* Financial summary - Only for Admin and Financial */}
          {canViewDocuments && task.price && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconCurrencyReal size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Valor Total</ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <ThemedText style={StyleSheet.flatten([styles.summaryValue, { color: colors.primary }])}>
                  {formatCurrency(task.price)}
                </ThemedText>
              </View>
            </Card>
          )}

          {/* Cuts Table - Hidden from FINANCIAL, LOGISTIC, COMMERCIAL (matches web) */}
          {/* Team leaders can swipe to request new cuts for tasks in their managed sector */}
          {canViewCuts && <CutsTable taskId={id as string} taskSectorId={task.sectorId} maxHeight={400} />}

          {/* Airbrushings Table - Hidden from WAREHOUSE, FINANCIAL, DESIGNER, LOGISTIC, COMMERCIAL (matches web) */}
          {canViewAirbrushing && <AirbrushingsTable taskId={id as string} maxHeight={400} />}

          {/* Changelog History - Only for Admin/Financial (all changes) or team leaders (sector changes) */}
          {/* Team leadership is now determined by managedSector relationship */}
          {(canViewDocuments || isTeamLeader(user)) && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.sectionHeaderLeft}>
                  <IconHistory size={20} color={colors.mutedForeground} />
                  <ThemedText style={styles.sectionTitle}>Histórico de Alterações</ThemedText>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <TaskWithServiceOrdersChangelog
                  taskId={task.id}
                  taskName={taskDisplayName}
                  taskCreatedAt={task.createdAt}
                  serviceOrderIds={(task.serviceOrders || []).map((so: any) => so.id)}
                  truckId={(task as any)?.truck?.id}
                  layoutIds={layouts?.data?.map((l: any) => l.id) || []}
                />
              </View>
            </Card>
          )}

          {/* Bottom spacing for mobile navigation */}
          <View style={{ height: spacing.xxl * 2 }} />
        </View>

        {/*
          File viewer modals (Image, PDF, Video) are automatically rendered
          by FileViewerProvider - no need to manually render them here!
        */}
      </ScrollView>
    </>
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
  sectionCard: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "500",
  },
  sectionContent: {
    gap: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
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
  cutsScroll: {
    marginTop: spacing.sm,
  },
  cutsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  cutItem: {
    width: 120,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  cutFileIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cutFileName: {
    fontSize: fontSize.xs,
    textAlign: "center",
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
  artworkItemContainer: {
    position: "relative",
  },
  artworkBadgeContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xxs,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
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
  observationContent: {
    marginTop: spacing.sm,
  },
  budgetExpiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  budgetExpiryContent: {
    flex: 1,
  },
  budgetExpiryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xxs,
  },
  budgetExpiryDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  budgetTableContainer: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
  },
  budgetTableHeader: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
  },
  budgetTableHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  budgetTableDescriptionColumn: {
    flex: 1,
    textAlign: "left",
  },
  budgetTableAmountColumn: {
    width: 120,
    textAlign: "right",
  },
  budgetTableBody: {
    backgroundColor: "transparent",
  },
  budgetTableRow: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  budgetTableRowLast: {
    borderBottomWidth: 0,
  },
  budgetTableCell: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  budgetTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 2,
  },
  budgetTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
  },
  budgetTotalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
});
