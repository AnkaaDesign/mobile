import { View, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useTheme } from '@/lib/theme';
import { useTasks, useScreenReady } from '@/hooks';
import { usePrivileges } from '@/hooks/usePrivileges';
import { GarageView } from '@/components/production/garage/garage-view';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TRUCK_SPOT, TASK_STATUS, SECTOR_PRIVILEGES } from '@/constants';
import { batchUpdateSpots } from '@/api-client/truck';
import { isTeamLeader } from '@/utils/user';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { GarageTruck } from '@/components/production/garage/garage-view';

export default function GaragesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // End navigation loading overlay when screen mounts
  useScreenReady();

  // Check privileges - only ADMIN, LOGISTIC, or team leaders can edit positions
  const { isAdmin, user, canAccess } = usePrivileges();
  const userIsTeamLeader = isTeamLeader(user);
  const canEditGaragePositions = isAdmin || userIsTeamLeader || canAccess([SECTOR_PRIVILEGES.LOGISTIC]);

  // Fetch tasks with trucks AND their layouts for dimensions
  // Optimized query: only select fields actually used by the garage view
  // Note: No status filter - completed tasks with garage spots should still be shown
  const { data: tasksResponse, isLoading, error, refetch } = useTasks({
    page: 1,
    limit: 100,
    // Only filter for tasks that have a truck assigned
    where: {
      truck: {
        isNot: null,
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      serialNumber: true,
      forecastDate: true,
      finishedAt: true,
      truck: {
        select: {
          id: true,
          spot: true,
          leftSideLayout: {
            select: {
              layoutSections: {
                select: {
                  width: true,
                },
              },
            },
          },
          rightSideLayout: {
            select: {
              layoutSections: {
                select: {
                  width: true,
                },
              },
            },
          },
        },
      },
      generalPainting: {
        select: {
          hex: true,
        },
      },
    },
  });

  // Transform tasks to garage trucks format
  // Filter logic matches web version:
  // - Must have a truck with layout sections defined (for dimensions)
  // - If truck has a garage spot (B1, B2, B3): always show (even if completed)
  // - If no spot (patio): only show if forecastDate <= today AND status !== COMPLETED
  const garageTrucks = useMemo(() => {
    if (!tasksResponse?.data) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasksResponse.data
      .filter((task) => {
        // Must have a truck
        if (!task.truck) return false;

        const truck = task.truck as any;

        // Must have a layout defined (for dimensions)
        const layout = truck?.leftSideLayout || truck?.rightSideLayout;
        const layoutSections = layout?.layoutSections || [];
        if (layoutSections.length === 0) return false;

        // If truck has a spot assigned in a garage, always include it (even if completed)
        if (truck?.spot) {
          return true;
        }

        // For patio: only include if forecastDate <= today AND status is not COMPLETED
        const forecastDate = (task as any).forecastDate;
        if (!forecastDate) return false;

        // Must not have COMPLETED status for patio display
        if (task.status === TASK_STATUS.COMPLETED) return false;

        const forecast = new Date(forecastDate);
        forecast.setHours(0, 0, 0, 0);
        return forecast <= today;
      })
      .map((task): GarageTruck => {
        const truck = task.truck as any;

        // Get layout sections from leftSideLayout or rightSideLayout
        const layout = truck?.leftSideLayout || truck?.rightSideLayout;
        const layoutSections = layout?.layoutSections || [];

        // Calculate truck length from layout sections
        const sectionsSum = layoutSections.reduce(
          (sum: number, section: { width: number }) => sum + (section.width || 0),
          0
        );

        // Add cabin if needed - two-tier system based on truck body length
        // < 7m body: 2.0m cabin (small trucks)
        // 7-10m body: 2.4m cabin (larger trucks)
        // >= 10m body: no cabin (semi-trailers)
        const CABIN_THRESHOLD_SMALL = 7;
        const CABIN_THRESHOLD_LARGE = 10;
        const CABIN_LENGTH_SMALL = 2.0;
        const CABIN_LENGTH_LARGE = 2.4;
        let truckLength = 10; // Default 10m if no sections
        if (sectionsSum > 0) {
          if (sectionsSum < CABIN_THRESHOLD_SMALL) {
            truckLength = sectionsSum + CABIN_LENGTH_SMALL;
          } else if (sectionsSum < CABIN_THRESHOLD_LARGE) {
            truckLength = sectionsSum + CABIN_LENGTH_LARGE;
          } else {
            truckLength = sectionsSum;
          }
        }

        return {
          id: task.id,
          truckId: truck?.id,
          spot: truck?.spot || null,
          taskName: task.name,
          serialNumber: (task as any).serialNumber || null,
          paintHex: (task.generalPainting as any)?.hex || null,
          length: truckLength,
          originalLength: sectionsSum > 0 ? sectionsSum : undefined,
          forecastDate: (task as any).forecastDate || null,
          finishedAt: (task as any).finishedAt || null,
        };
      });
  }, [tasksResponse]);

  // Handle batch save of all spot changes using single API call
  const handleSaveChanges = useCallback(
    async (changes: Array<{ truckId: string; newSpot: TRUCK_SPOT | null }>) => {
      // Convert task IDs to truck IDs for the API
      const updates = changes
        .map((change) => {
          // The truckId from GarageView is actually the task ID - need to find the actual truck ID
          const garageTruck = garageTrucks.find((t) => t.id === change.truckId);
          if (!garageTruck?.truckId) return null;
          return {
            truckId: garageTruck.truckId,
            spot: change.newSpot,
          };
        })
        .filter((u): u is { truckId: string; spot: TRUCK_SPOT | null } => u !== null);

      if (updates.length === 0) return;

      setIsUpdating(true);
      try {
        await batchUpdateSpots(updates);
        await refetch();
      } finally {
        setIsUpdating(false);
      }
    },
    [garageTrucks, refetch]
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  // Calculate skeleton dimensions to match actual garage view
  const CONTAINER_PADDING = 16;
  const ACTION_BAR_HEIGHT = 72;
  const ACTION_BAR_MARGIN = 8;
  const SAFE_AREA_BOTTOM = Math.max(insets.bottom, 16);
  const containerWidth = screenWidth - CONTAINER_PADDING * 2;
  const skeletonGarageHeight = screenHeight - insets.top - CONTAINER_PADDING * 2 - SAFE_AREA_BOTTOM - ACTION_BAR_HEIGHT - ACTION_BAR_MARGIN - 120;

  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: CONTAINER_PADDING, paddingTop: CONTAINER_PADDING }]}>
        {/* Main Card Skeleton */}
        <Card style={[styles.skeletonCard, { marginBottom: canEditGaragePositions ? ACTION_BAR_MARGIN : SAFE_AREA_BOTTOM }]}>
          <View style={styles.skeletonContent}>
            {/* Header skeleton - Title */}
            <View style={styles.skeletonHeader}>
              <SkeletonCard height={24} width={120} borderRadius={6} />
            </View>

            {/* Dots skeleton */}
            <View style={styles.skeletonDots}>
              {[0, 1, 2, 3].map((i) => (
                <SkeletonCard key={i} height={10} width={10} borderRadius={5} />
              ))}
            </View>

            {/* Garage visualization skeleton */}
            <View style={styles.skeletonGarageContainer}>
              {/* Left nav button placeholder */}
              <View style={styles.skeletonNavButton}>
                <SkeletonCard height={24} width={24} borderRadius={12} />
              </View>

              {/* Garage area skeleton */}
              <View style={styles.skeletonGarageArea}>
                {/* Ruler skeleton (left) */}
                <View style={styles.skeletonRuler}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <SkeletonCard key={i} height={2} width={20} borderRadius={1} style={{ marginVertical: 20 }} />
                  ))}
                </View>

                {/* Main garage rectangle skeleton */}
                <SkeletonCard
                  height={Math.max(skeletonGarageHeight, 300)}
                  width={containerWidth - 120}
                  borderRadius={8}
                />
              </View>

              {/* Right nav button placeholder */}
              <View style={styles.skeletonNavButton}>
                <SkeletonCard height={24} width={24} borderRadius={12} />
              </View>
            </View>
          </View>
        </Card>

        {/* Action Bar Skeleton - only show if user can edit */}
        {canEditGaragePositions && (
          <View style={[styles.skeletonActionBar, { marginBottom: SAFE_AREA_BOTTOM, backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.skeletonActionButton}>
              <SkeletonCard height={44} width="100%" borderRadius={8} />
            </View>
            <View style={styles.skeletonActionButton}>
              <SkeletonCard height={44} width="100%" borderRadius={8} />
            </View>
          </View>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <Card style={{ padding: 16, alignItems: 'center', gap: 12 }}>
          <Icon name="alert-circle" size="xl" color={colors.destructive} />
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '600' }}>
            Erro ao carregar barracões
          </Text>
          <Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>
            {(error as Error).message || 'Tente novamente mais tarde'}
          </Text>
        </Card>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GarageView
        trucks={garageTrucks}
        onSaveChanges={canEditGaragePositions ? handleSaveChanges : undefined}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isSaving={isUpdating}
        readOnly={!canEditGaragePositions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonCard: {
    flex: 1,
    overflow: 'hidden',
  },
  skeletonContent: {
    flex: 1,
    padding: 16,
  },
  skeletonHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  skeletonDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  skeletonGarageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonNavButton: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonGarageArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonRuler: {
    marginRight: 8,
    alignItems: 'flex-end',
  },
  skeletonActionBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  skeletonActionButton: {
    flex: 1,
  },
});
