import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { useMaintenance, useMaintenanceMutations } from '@/hooks';
import { ThemedText, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useNav } from '@/contexts/nav';
import { mobileRoute } from '@/constants/routes.types';
import { formatCurrency, formatQuantity, formatDate, formatDateTime } from '@/utils';
import {
  MAINTENANCE_STATUS,
  MAINTENANCE_STATUS_LABELS,
  SCHEDULE_FREQUENCY_LABELS,
  MEASURE_UNIT_LABELS,
  SECTOR_PRIVILEGES,
  routes,
} from '@/constants';
import { useCanViewPrices } from '@/hooks';
import {
  IconChevronRight,
  IconBox,
  IconPackage,
  IconCalendar,
  IconAlertCircle,
  IconTool,
} from '@tabler/icons-react-native';
import { spacing, fontSize } from '@/constants/design-system';
import { DetailScreen } from '@/components/screens/detail-screen';

export default function MaintenanceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNav();
  const { deleteMutation } = useMaintenanceMutations();

  const query = useMaintenance(id, {
    include: {
      item: {
        include: {
          brands: true,
          category: true,
          supplier: true,
          prices: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
      itemsNeeded: {
        include: {
          item: {
            include: {
              prices: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      },
      maintenanceSchedule: {
        include: {
          item: { select: { id: true, name: true, uniCode: true } },
        },
      },
    },
  });

  return (
    <DetailScreen
      query={query as any}
      icon={IconTool}
      privilege={{
        any: [
          SECTOR_PRIVILEGES.WAREHOUSE,
          SECTOR_PRIVILEGES.MAINTENANCE,
          SECTOR_PRIVILEGES.ADMIN,
        ],
      }}
      editRoute={(m: any) => mobileRoute(routes.inventory.maintenance.edit(m.id))}
      deleteAction={{
        mutation: deleteMutation,
        confirmText: 'Tem certeza que deseja excluir esta manutenção?',
        successRoute: mobileRoute(routes.inventory.maintenance.root),
      }}
      notFoundFallback={mobileRoute(routes.inventory.maintenance.root)}
      status={(m: any) => ({
        label:
          MAINTENANCE_STATUS_LABELS[m.status as keyof typeof MAINTENANCE_STATUS_LABELS] ?? m.status,
        variant:
          m.status === MAINTENANCE_STATUS.COMPLETED
            ? 'success'
            : m.status === MAINTENANCE_STATUS.IN_PROGRESS
              ? 'info'
              : m.status === MAINTENANCE_STATUS.PENDING
                ? 'warning'
                : 'default',
      })}
    >
      {(maintenance: any) => <MaintenanceBody maintenance={maintenance} />}
    </DetailScreen>
  );
}

function MaintenanceBody({ maintenance }: { maintenance: any }) {
  const { colors } = useTheme();
  const nav = useNav();
  // Money is hidden from WAREHOUSE users by app-wide convention.
  const canViewPrices = useCanViewPrices();

  const targetItem = maintenance.item;
  const maintenanceItems = maintenance.itemsNeeded || [];
  const schedule = maintenance.maintenanceSchedule;

  const estimatedCost = maintenanceItems.reduce((total: number, mi: any) => {
    if (!mi.item) return total;
    const itemPrice = mi.item.prices && mi.item.prices.length > 0 ? mi.item.prices[0].value : 0;
    return total + itemPrice * mi.quantity;
  }, 0);

  const itemsWithStock = maintenanceItems.filter(
    (mi: any) => mi.item && mi.item.quantity >= mi.quantity,
  ).length;
  const itemsWithoutStock = maintenanceItems.length - itemsWithStock;

  const getFrequencyLabel = () => {
    const freq = maintenance.frequency || schedule?.frequency;
    const count = maintenance.frequencyCount || schedule?.frequencyCount;
    if (!freq) return '-';
    const baseLabel =
      SCHEDULE_FREQUENCY_LABELS[freq as keyof typeof SCHEDULE_FREQUENCY_LABELS] || freq;
    return count && count > 1 ? `${baseLabel} (x${count})` : baseLabel;
  };

  return (
    <View style={styles.body}>
      {/* Header / Description card */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.headerRow}>
            <CardTitle>{maintenance.name || 'Manutenção'}</CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          {maintenance.description ? (
            <View style={styles.section}>
              <ThemedText style={styles.sectionLabel}>Descrição</ThemedText>
              <ThemedText style={styles.description}>{maintenance.description}</ThemedText>
            </View>
          ) : null}

          <View style={styles.infoGrid}>
            {(maintenance.frequency || schedule?.frequency) && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Frequência:</ThemedText>
                <ThemedText style={styles.infoValue}>{getFrequencyLabel()}</ThemedText>
              </View>
            )}

            {maintenance.nextRun && (
              <View style={styles.infoRow}>
                <IconCalendar size={16} color={colors.mutedForeground} style={styles.infoIcon} />
                <ThemedText style={styles.infoLabel}>Próxima Execução:</ThemedText>
                <ThemedText style={styles.infoValue}>{formatDate(maintenance.nextRun)}</ThemedText>
              </View>
            )}

            {maintenance.lastRun && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Última Execução:</ThemedText>
                <ThemedText style={styles.infoValue}>{formatDate(maintenance.lastRun)}</ThemedText>
              </View>
            )}

            {canViewPrices && estimatedCost > 0 && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Custo Estimado:</ThemedText>
                <ThemedText style={[styles.infoValue, styles.currencyValue]}>
                  {formatCurrency(estimatedCost)}
                </ThemedText>
              </View>
            )}

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {formatDateTime(maintenance.createdAt)}
              </ThemedText>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Target Item Card */}
      {targetItem && (
        <Card style={styles.card}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconBox size={20} color={colors.mutedForeground} />
              <ThemedText style={styles.title}>Equipamento</ThemedText>
            </View>
          </View>
          <View style={styles.content}>
            <Pressable
              onPress={() =>
                nav.push(mobileRoute(routes.inventory.products.details(targetItem.id)))
              }
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
                {targetItem.brands && targetItem.brands.length > 0 && (
                  <View style={styles.itemDetailRow}>
                    <ThemedText style={styles.detailLabel}>Marca:</ThemedText>
                    <ThemedText style={styles.detailValue}>{targetItem.brands.map((b: any) => b.name).join(", ")}</ThemedText>
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
                      {targetItem.supplier.fantasyName}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.stockRow}>
                  <View style={styles.stockItem}>
                    <ThemedText style={styles.detailLabel}>Estoque</ThemedText>
                    <ThemedText style={styles.stockValue}>
                      {formatQuantity(targetItem.quantity || 0)}
                      {targetItem.measureUnit &&
                        ` ${MEASURE_UNIT_LABELS[targetItem.measureUnit as keyof typeof MEASURE_UNIT_LABELS]}`}
                    </ThemedText>
                  </View>
                  {canViewPrices && targetItem.prices && targetItem.prices.length > 0 && (
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
          </View>
        </Card>
      )}

      {/* Maintenance Items Card */}
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconPackage size={20} color={colors.mutedForeground} />
            <ThemedText style={styles.title}>Itens Necessários</ThemedText>
          </View>
        </View>
        <View style={styles.content}>
          {maintenanceItems.length === 0 ? (
            <View style={styles.emptyState}>
              <IconAlertCircle size={48} color={colors.mutedForeground} />
              <ThemedText style={styles.emptyText}>Nenhum item necessário</ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
                  <ThemedText style={styles.statLabel}>Total</ThemedText>
                  <ThemedText style={styles.statValue}>{maintenanceItems.length}</ThemedText>
                </View>
                <View style={[styles.statCard, { backgroundColor: `${colors.success}20` }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.success }]}>
                    Com Estoque
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.success }]}>
                    {itemsWithStock}
                  </ThemedText>
                </View>
                <View style={[styles.statCard, { backgroundColor: `${colors.destructive}20` }]}>
                  <ThemedText style={[styles.statLabel, { color: colors.destructive }]}>
                    Sem Estoque
                  </ThemedText>
                  <ThemedText style={[styles.statValue, { color: colors.destructive }]}>
                    {itemsWithoutStock}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.itemsList}>
                {maintenanceItems.map((maintenanceItem: any, index: number) => {
                  const item = maintenanceItem.item;
                  const hasStock = item && item.quantity >= maintenanceItem.quantity;

                  return (
                    <View
                      key={maintenanceItem.id || index}
                      style={[
                        styles.maintenanceItem,
                        { borderLeftColor: hasStock ? colors.success : colors.destructive },
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
                            <ThemedText style={styles.maintenanceItemLabel}>
                              Necessário:
                            </ThemedText>
                            <ThemedText style={styles.maintenanceItemValue}>
                              {formatQuantity(maintenanceItem.quantity)}{' '}
                              {item.measureUnit &&
                                MEASURE_UNIT_LABELS[
                                  item.measureUnit as keyof typeof MEASURE_UNIT_LABELS
                                ]}
                            </ThemedText>
                          </View>
                          <View style={styles.maintenanceItemRow}>
                            <ThemedText style={styles.maintenanceItemLabel}>
                              Disponível:
                            </ThemedText>
                            <ThemedText
                              style={[
                                styles.maintenanceItemValue,
                                { color: hasStock ? colors.success : colors.destructive },
                              ]}
                            >
                              {formatQuantity(item.quantity || 0)}{' '}
                              {item.measureUnit &&
                                MEASURE_UNIT_LABELS[
                                  item.measureUnit as keyof typeof MEASURE_UNIT_LABELS
                                ]}
                            </ThemedText>
                          </View>
                          {canViewPrices && item.prices && item.prices.length > 0 && (
                            <View style={styles.maintenanceItemRow}>
                              <ThemedText style={styles.maintenanceItemLabel}>
                                Custo Unit.:
                              </ThemedText>
                              <ThemedText
                                style={[styles.maintenanceItemValue, styles.currencyValue]}
                              >
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
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  content: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
