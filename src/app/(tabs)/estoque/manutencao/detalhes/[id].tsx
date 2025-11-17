import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMaintenance } from '@/hooks';
import { ThemedView, ThemedText, Card, CardHeader, CardTitle, CardContent, ErrorScreen, Button, Badge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';
import { MAINTENANCE_STATUS, MAINTENANCE_STATUS_LABELS, SCHEDULE_FREQUENCY_LABELS, MEASURE_UNIT_LABELS } from '@/constants';
import { useState, useCallback } from 'react';
import { IconChevronRight, IconBox, IconPackage, IconCalendar, IconAlertCircle } from '@tabler/react-native-icons';

export default function MaintenanceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: maintenance, isLoading, error, refetch } = useMaintenance(id, {
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
          prices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      itemsNeeded: {
        include: {
          item: {
            include: {
              prices: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
      maintenanceSchedule: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              uniCode: true,
            },
          },
        },
      },
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando manutenção...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !maintenance) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar manutenção"
          detail={error?.message || 'Manutenção não encontrada'}
          onRetry={handleRefresh}
        />
      </ThemedView>
    );
  }

  const targetItem = maintenance.item;
  const maintenanceItems = maintenance.itemsNeeded || [];
  const schedule = maintenance.maintenanceSchedule;

  // Calculate estimated cost
  const estimatedCost = maintenanceItems.reduce((total, mi) => {
    if (!mi.item) return total;
    const itemPrice = mi.item.prices && mi.item.prices.length > 0 ? mi.item.prices[0].value : 0;
    return total + itemPrice * mi.quantity;
  }, 0);

  // Calculate items statistics
  const itemsWithStock = maintenanceItems.filter((mi) => mi.item && mi.item.quantity >= mi.quantity).length;
  const itemsWithoutStock = maintenanceItems.length - itemsWithStock;

  // Get frequency label
  const getFrequencyLabel = () => {
    const freq = maintenance.frequency || schedule?.frequency;
    const count = maintenance.frequencyCount || schedule?.frequencyCount;
    if (!freq) return '-';
    const baseLabel = SCHEDULE_FREQUENCY_LABELS[freq] || freq;
    return count && count > 1 ? `${baseLabel} (x${count})` : baseLabel;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Card - Maintenance Info */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.headerRow}>
              <CardTitle>{maintenance.name || 'Manutenção'}</CardTitle>
              <Badge
                variant={
                  maintenance.status === MAINTENANCE_STATUS.COMPLETED ? 'success' :
                  maintenance.status === MAINTENANCE_STATUS.IN_PROGRESS ? 'info' :
                  maintenance.status === MAINTENANCE_STATUS.SCHEDULED ? 'warning' :
                  'default'
                }
              >
                {MAINTENANCE_STATUS_LABELS[maintenance.status] || maintenance.status}
              </Badge>
            </View>
          </CardHeader>
          <CardContent>
            {maintenance.description && (
              <View style={styles.section}>
                <ThemedText style={styles.sectionLabel}>Descrição</ThemedText>
                <ThemedText style={styles.description}>{maintenance.description}</ThemedText>
              </View>
            )}

            <View style={styles.infoGrid}>
              {/* Frequency */}
              {(maintenance.frequency || schedule?.frequency) && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Frequência:</ThemedText>
                  <ThemedText style={styles.infoValue}>{getFrequencyLabel()}</ThemedText>
                </View>
              )}

              {/* Next Run */}
              {maintenance.nextRun && (
                <View style={styles.infoRow}>
                  <IconCalendar size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                  <ThemedText style={styles.infoLabel}>Próxima Execução:</ThemedText>
                  <ThemedText style={styles.infoValue}>{formatDate(maintenance.nextRun)}</ThemedText>
                </View>
              )}

              {/* Last Run */}
              {maintenance.lastRun && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Última Execução:</ThemedText>
                  <ThemedText style={styles.infoValue}>{formatDate(maintenance.lastRun)}</ThemedText>
                </View>
              )}

              {/* Estimated Cost */}
              {estimatedCost > 0 && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Custo Estimado:</ThemedText>
                  <ThemedText style={[styles.infoValue, styles.currencyValue]}>
                    {formatCurrency(estimatedCost)}
                  </ThemedText>
                </View>
              )}

              {/* Created/Updated */}
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
                <ThemedText style={styles.infoValue}>{formatDateTime(maintenance.createdAt)}</ThemedText>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Target Item Card */}
        {targetItem && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardTitleRow}>
                <IconBox size={20} color={colors.primary} />
                <CardTitle>Equipamento</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <Pressable
                onPress={() => router.push(`/(tabs)/estoque/produtos/detalhes/${targetItem.id}` as any)}
                style={styles.itemPressable}
              >
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.itemName}>{targetItem.name}</ThemedText>
                    {targetItem.uniCode && (
                      <ThemedText style={styles.itemCode}>{targetItem.uniCode}</ThemedText>
                    )}
                  </View>
                  <IconChevronRight size={20} color={colors.mutedForeground} />
                </View>

                <View style={styles.itemDetails}>
                  {targetItem.brand && (
                    <View style={styles.itemDetailRow}>
                      <ThemedText style={styles.detailLabel}>Marca:</ThemedText>
                      <ThemedText style={styles.detailValue}>{targetItem.brand.name}</ThemedText>
                    </View>
                  )}
                  {targetItem.category && (
                    <View style={styles.itemDetailRow}>
                      <ThemedText style={styles.detailLabel}>Categoria:</ThemedText>
                      <ThemedText style={styles.detailValue}>{targetItem.category.name}</ThemedText>
                    </View>
                  )}
                  {targetItem.supplier && (
                    <View style={styles.itemDetailRow}>
                      <ThemedText style={styles.detailLabel}>Fornecedor:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {targetItem.supplier.fantasyName || targetItem.supplier.name}
                      </ThemedText>
                    </View>
                  )}

                  <View style={styles.stockRow}>
                    <View style={styles.stockItem}>
                      <ThemedText style={styles.detailLabel}>Estoque</ThemedText>
                      <ThemedText style={styles.stockValue}>
                        {targetItem.quantity || 0}
                        {targetItem.measureUnit && ` ${MEASURE_UNIT_LABELS[targetItem.measureUnit]}`}
                      </ThemedText>
                    </View>
                    {targetItem.prices && targetItem.prices.length > 0 && (
                      <View style={styles.stockItem}>
                        <ThemedText style={styles.detailLabel}>Preço</ThemedText>
                        <ThemedText style={[styles.stockValue, styles.currencyValue]}>
                          {formatCurrency(targetItem.prices[0].value)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Items Card */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardTitleRow}>
              <IconPackage size={20} color={colors.primary} />
              <CardTitle>Itens Necessários</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {maintenanceItems.length === 0 ? (
              <View style={styles.emptyState}>
                <IconAlertCircle size={48} color={colors.mutedForeground} />
                <ThemedText style={styles.emptyText}>Nenhum item necessário</ThemedText>
              </View>
            ) : (
              <>
                {/* Statistics */}
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
                    <ThemedText style={styles.statLabel}>Total</ThemedText>
                    <ThemedText style={styles.statValue}>{maintenanceItems.length}</ThemedText>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: `${colors.success}20` }]}>
                    <ThemedText style={[styles.statLabel, { color: colors.success }]}>Com Estoque</ThemedText>
                    <ThemedText style={[styles.statValue, { color: colors.success }]}>{itemsWithStock}</ThemedText>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: `${colors.destructive}20` }]}>
                    <ThemedText style={[styles.statLabel, { color: colors.destructive }]}>Sem Estoque</ThemedText>
                    <ThemedText style={[styles.statValue, { color: colors.destructive }]}>{itemsWithoutStock}</ThemedText>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.itemsList}>
                  {maintenanceItems.map((maintenanceItem, index) => {
                    const item = maintenanceItem.item;
                    const hasStock = item && item.quantity >= maintenanceItem.quantity;

                    return (
                      <View
                        key={maintenanceItem.id || index}
                        style={[
                          styles.maintenanceItem,
                          { borderLeftColor: hasStock ? colors.success : colors.destructive }
                        ]}
                      >
                        <View style={styles.maintenanceItemHeader}>
                          <ThemedText style={styles.maintenanceItemName}>
                            {item?.name || 'Item não encontrado'}
                          </ThemedText>
                          <Badge variant={hasStock ? 'success' : 'destructive'}>
                            {hasStock ? 'Disponível' : 'Indisponível'}
                          </Badge>
                        </View>

                        {item && (
                          <>
                            <View style={styles.maintenanceItemRow}>
                              <ThemedText style={styles.maintenanceItemLabel}>Necessário:</ThemedText>
                              <ThemedText style={styles.maintenanceItemValue}>
                                {maintenanceItem.quantity} {item.measureUnit && MEASURE_UNIT_LABELS[item.measureUnit]}
                              </ThemedText>
                            </View>
                            <View style={styles.maintenanceItemRow}>
                              <ThemedText style={styles.maintenanceItemLabel}>Disponível:</ThemedText>
                              <ThemedText style={[
                                styles.maintenanceItemValue,
                                { color: hasStock ? colors.success : colors.destructive }
                              ]}>
                                {item.quantity || 0} {item.measureUnit && MEASURE_UNIT_LABELS[item.measureUnit]}
                              </ThemedText>
                            </View>
                            {item.prices && item.prices.length > 0 && (
                              <View style={styles.maintenanceItemRow}>
                                <ThemedText style={styles.maintenanceItemLabel}>Custo Unit.:</ThemedText>
                                <ThemedText style={[styles.maintenanceItemValue, styles.currencyValue]}>
                                  {formatCurrency(item.prices[0].value)}
                                </ThemedText>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => router.push(`/(tabs)/estoque/manutencao/editar/${id}` as any)}
            style={styles.actionButton}
          >
            Editar Manutenção
          </Button>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    opacity: 0.7,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoGrid: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  currencyValue: {
    fontFamily: 'monospace',
  },
  itemPressable: {
    gap: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.7,
    marginTop: 2,
  },
  itemDetails: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  stockItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.7,
  },
  itemsList: {
    gap: 12,
  },
  maintenanceItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderLeftWidth: 4,
    gap: 6,
  },
  maintenanceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  maintenanceItemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  maintenanceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maintenanceItemLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  maintenanceItemValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
