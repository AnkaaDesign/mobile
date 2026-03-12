import { useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import { Sheet } from '@/components/ui/sheet';
import { Badge, getBadgeVariantFromStatus } from '@/components/ui/badge';
import { CustomerLogoDisplay } from '@/components/ui/customer-logo-display';
import { FilePreviewModal } from '@/components/file';
import { useTaskDetail } from '@/hooks/useTask';
import { useCurrentUser } from '@/hooks/useAuth';
import { useFilePreview } from '@/hooks/use-file-preview';
import { formatDateTime } from '@/utils/date';
import { hasPrivilege } from '@/utils/user';
import {
  IconHash,
  IconCar,
  IconBarcode,
  IconBuilding,
  IconBuildingFactory2,
  IconCalendarTime,
  IconCalendarDue,
  IconLogin,
  IconLayoutGrid,
  IconListCheck,
  IconFiles,
  IconFile,
} from '@tabler/icons-react-native';
import { SERVICE_ORDER_STATUS, SERVICE_ORDER_TYPE, SECTOR_PRIVILEGES, TASK_STATUS } from '@/constants';
import { SERVICE_ORDER_STATUS_LABELS } from '@/constants/enum-labels';
import { API_BASE_URL } from '@/config/urls';
import { rewriteCdnUrl } from '@/utils/file-viewer-utils';

const ARTWORK_STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprovado',
  REPROVED: 'Reprovado',
  DRAFT: 'Rascunho',
};

interface TruckDetailModalProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TruckDetailModal({ taskId, open, onOpenChange }: TruckDetailModalProps) {
  const { colors } = useTheme();
  const { data: currentUser } = useCurrentUser();
  const filePreview = useFilePreview();

  const { data: taskResponse, isLoading } = useTaskDetail(taskId ?? '', {
    enabled: open && !!taskId,
    include: {
      customer: {
        include: {
          logo: true,
        },
      },
      truck: {
        include: {
          leftSideLayout: {
            include: { layoutSections: true },
          },
          rightSideLayout: {
            include: { layoutSections: true },
          },
        },
      },
      sector: true,
      artworks: {
        include: {
          file: true,
        },
      },
      serviceOrders: true,
    },
  });

  const task = taskResponse?.data;

  // Check if user can view artwork badges (ADMIN, COMMERCIAL, LOGISTIC, PRODUCTION_MANAGER, DESIGNER)
  const canViewArtworkBadges = currentUser && (
    hasPrivilege(currentUser, SECTOR_PRIVILEGES.ADMIN) ||
    hasPrivilege(currentUser, SECTOR_PRIVILEGES.COMMERCIAL) ||
    hasPrivilege(currentUser, SECTOR_PRIVILEGES.LOGISTIC) ||
    hasPrivilege(currentUser, SECTOR_PRIVILEGES.PRODUCTION_MANAGER) ||
    hasPrivilege(currentUser, SECTOR_PRIVILEGES.DESIGNER)
  );

  // Filter artworks: show all if user can view badges, otherwise only approved
  const filteredArtworks = useMemo(() => {
    if (!task?.artworks) return [];
    return (task.artworks as any[]).filter((artwork) => {
      const hasFileData = artwork.file || artwork.filename || artwork.path;
      return hasFileData && (canViewArtworkBadges || artwork.status === 'APPROVED');
    });
  }, [task, canViewArtworkBadges]);

  // Get layout dimensions
  const layoutDimensions = useMemo(() => {
    if (!task?.truck) return null;
    const truck = task.truck as any;
    const layout = truck?.leftSideLayout || truck?.rightSideLayout;
    if (!layout || !layout.layoutSections || layout.layoutSections.length === 0) return null;
    const totalLength = layout.layoutSections.reduce(
      (sum: number, section: { width: number }) => sum + (section.width || 0),
      0,
    );
    return { totalLength, height: layout.height };
  }, [task]);

  // Check if term is overdue (only for active tasks)
  const isOverdue = useMemo(() => {
    if (!task?.term) return false;
    if (task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED) return false;
    return new Date(task.term) < new Date();
  }, [task]);

  // Production service orders
  const productionSOs = useMemo(() => {
    if (!task?.serviceOrders) return [];
    return (task.serviceOrders as any[]).filter(
      (so: any) => so.type === SERVICE_ORDER_TYPE.PRODUCTION,
    );
  }, [task]);

  const completedCount = productionSOs.filter(
    (so: any) => so.status === SERVICE_ORDER_STATUS.COMPLETED,
  ).length;

  // Progress bar segments
  const progressSegments = useMemo(() => {
    if (productionSOs.length === 0) return [];
    const total = productionSOs.length;
    const counts: Record<string, { count: number; color: string }> = {
      [SERVICE_ORDER_STATUS.COMPLETED]: { count: 0, color: '#15803d' },
      [SERVICE_ORDER_STATUS.WAITING_APPROVE]: { count: 0, color: '#9333ea' },
      [SERVICE_ORDER_STATUS.IN_PROGRESS]: { count: 0, color: '#1d4ed8' },
      [SERVICE_ORDER_STATUS.PENDING]: { count: 0, color: '#737373' },
      [SERVICE_ORDER_STATUS.CANCELLED]: { count: 0, color: '#b91c1c' },
    };
    for (const so of productionSOs) {
      if (counts[so.status]) counts[so.status].count++;
    }
    return Object.entries(counts)
      .filter(([, v]) => v.count > 0)
      .map(([, v]) => ({ width: (v.count / total) * 100, color: v.color }));
  }, [productionSOs]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} snapPoints={[60, 85]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={2}>
            {task?.name || 'Detalhes da Tarefa'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[styles.skeletonRow, { backgroundColor: colors.muted }]}
              />
            ))}
          </View>
        ) : task ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Customer */}
            {task.customer && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconBuilding size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Cliente
                  </Text>
                </View>
                <View style={styles.customerValue}>
                  <CustomerLogoDisplay
                    logo={(task.customer as any).logo}
                    customerName={(task.customer as any).fantasyName || ''}
                    size="xs"
                    shape="rounded"
                  />
                  <Text
                    style={[styles.valueText, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {(task.customer as any).fantasyName}
                  </Text>
                </View>
              </View>
            )}

            {/* Serial Number */}
            {task.serialNumber && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconHash size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Nº Série
                  </Text>
                </View>
                <Text style={[styles.valueText, { color: colors.foreground }]}>
                  {task.serialNumber}
                </Text>
              </View>
            )}

            {/* Plate */}
            {(task.truck as any)?.plate && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconCar size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Placa
                  </Text>
                </View>
                <Text
                  style={[
                    styles.valueText,
                    { color: colors.foreground, textTransform: 'uppercase' },
                  ]}
                >
                  {(task.truck as any).plate}
                </Text>
              </View>
            )}

            {/* Chassis Number */}
            {(task.truck as any)?.chassisNumber && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconBarcode size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Chassi
                  </Text>
                </View>
                <Text
                  style={[
                    styles.valueText,
                    { color: colors.foreground, textTransform: 'uppercase' },
                  ]}
                >
                  {(task.truck as any).chassisNumber}
                </Text>
              </View>
            )}

            {/* Sector */}
            {(task as any).sector?.name && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconBuildingFactory2 size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Setor
                  </Text>
                </View>
                <Text style={[styles.valueText, { color: colors.foreground }]}>
                  {(task as any).sector.name}
                </Text>
              </View>
            )}

            {/* Entry Date */}
            {(task as any).entryDate && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconLogin size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Entrada
                  </Text>
                </View>
                <Text style={[styles.valueText, { color: colors.foreground }]}>
                  {formatDateTime((task as any).entryDate)}
                </Text>
              </View>
            )}

            {/* Forecast Date */}
            {task.forecastDate && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconCalendarTime size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Previsão
                  </Text>
                </View>
                <Text style={[styles.valueText, { color: colors.foreground }]}>
                  {formatDateTime(task.forecastDate)}
                </Text>
              </View>
            )}

            {/* Term */}
            {task.term && (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.1)' : colors.muted,
                    borderWidth: isOverdue ? 1 : 0,
                    borderColor: isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
                  },
                ]}
              >
                <View style={styles.rowLabel}>
                  <IconCalendarDue
                    size={16}
                    color={isOverdue ? '#dc2626' : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.labelText,
                      { color: isOverdue ? '#dc2626' : colors.mutedForeground },
                    ]}
                  >
                    Prazo
                  </Text>
                </View>
                <Text
                  style={[
                    styles.valueText,
                    { color: isOverdue ? '#b91c1c' : colors.foreground },
                  ]}
                >
                  {formatDateTime(task.term)}
                  {isOverdue ? ' (Atrasado)' : ''}
                </Text>
              </View>
            )}

            {/* Layout dimensions */}
            {layoutDimensions && (
              <View style={[styles.row, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconLayoutGrid size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Medidas
                  </Text>
                </View>
                <Text style={[styles.valueText, { color: colors.foreground }]}>
                  {Math.round(layoutDimensions.totalLength * 100)} x{' '}
                  {Math.round(layoutDimensions.height * 100)} cm
                </Text>
              </View>
            )}

            {/* Service Orders (Production) */}
            {productionSOs.length > 0 && (
              <View style={[styles.soContainer, { backgroundColor: colors.muted }]}>
                <View style={styles.soHeader}>
                  <View style={styles.rowLabel}>
                    <IconListCheck size={16} color={colors.mutedForeground} />
                    <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                      Ordens de Produção
                    </Text>
                  </View>
                  <Text style={[styles.soCount, { color: colors.mutedForeground }]}>
                    {completedCount}/{productionSOs.length}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                  {progressSegments.map((segment, i) => (
                    <View
                      key={i}
                      style={{
                        width: `${segment.width}%` as any,
                        height: '100%',
                        backgroundColor: segment.color,
                      }}
                    />
                  ))}
                  <View style={styles.progressLabel}>
                    <Text style={styles.progressText}>
                      {completedCount}/{productionSOs.length}
                    </Text>
                  </View>
                </View>

                {/* Service order list */}
                {productionSOs.map((so: any, index: number) => (
                  <View
                    key={so.id || index}
                    style={[
                      styles.soItem,
                      index < productionSOs.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.soDescription, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {so.description || (
                        <Text style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>
                          Sem descrição
                        </Text>
                      )}
                    </Text>
                    <Badge
                      variant={getBadgeVariantFromStatus(so.status, 'serviceOrder')}
                      size="sm"
                    >
                      {SERVICE_ORDER_STATUS_LABELS[so.status as SERVICE_ORDER_STATUS]}
                    </Badge>
                  </View>
                ))}
              </View>
            )}

            {/* Artworks / Layouts */}
            {filteredArtworks.length > 0 && (
              <View style={[styles.artworksContainer, { backgroundColor: colors.muted }]}>
                <View style={styles.rowLabel}>
                  <IconFiles size={16} color={colors.mutedForeground} />
                  <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
                    Layouts
                  </Text>
                </View>
                <View style={styles.artworksGrid}>
                  {filteredArtworks.map((artwork: any, index: number) => {
                    const fileData = artwork.file || artwork;
                    const thumbnailUrl = fileData.thumbnailUrl || fileData.url;
                    const fullUrl = thumbnailUrl?.startsWith('http')
                      ? rewriteCdnUrl(thumbnailUrl)
                      : thumbnailUrl
                        ? `${API_BASE_URL}${thumbnailUrl}`
                        : null;

                    return (
                      <TouchableOpacity
                        key={artwork.id || artwork.artworkId || index}
                        activeOpacity={0.7}
                        onPress={() => {
                          const allFiles = filteredArtworks.map((a: any) => a.file || a);
                          filePreview.openPreview(allFiles, index);
                        }}
                        style={[styles.artworkItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                      >
                        {fullUrl ? (
                          <Image
                            source={{ uri: fullUrl }}
                            style={styles.artworkThumbnail}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.artworkPlaceholder, { backgroundColor: colors.muted }]}>
                            <IconFile size={20} color={colors.mutedForeground} />
                          </View>
                        )}
                        {canViewArtworkBadges && artwork.status && (
                          <View style={styles.artworkBadgeContainer}>
                            <Badge
                              variant={
                                artwork.status === 'APPROVED'
                                  ? 'success'
                                  : artwork.status === 'REPROVED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              size="sm"
                            >
                              {ARTWORK_STATUS_LABELS[artwork.status] || artwork.status}
                            </Badge>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ color: colors.mutedForeground }}>Tarefa não encontrada</Text>
          </View>
        )}
      </View>

      {/* File Preview Modal */}
      <FilePreviewModal
        files={filePreview.files}
        initialFileIndex={filePreview.currentFileIndex}
        visible={filePreview.isVisible}
        onClose={filePreview.closePreview}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 16,
    gap: 10,
  },
  skeletonRow: {
    height: 44,
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: '55%' as any,
  },
  customerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  soContainer: {
    borderRadius: 10,
    padding: 14,
  },
  soHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  soCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 18,
    borderRadius: 9,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressLabel: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 18,
    includeFontPadding: false,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  soItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  soDescription: {
    fontSize: 12,
    flex: 1,
  },
  artworksContainer: {
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  artworksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  artworkItem: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  artworkThumbnail: {
    width: '100%',
    height: '100%',
  },
  artworkPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkBadgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
});
