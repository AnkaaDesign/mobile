import { View, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useTheme } from '@/lib/theme';
import { useTasks } from '@/hooks/useTask';
import { usePrivileges } from '@/hooks/usePrivileges';
import { GarageView } from '@/components/production/garage/garage-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TRUCK_SPOT, TASK_STATUS, SECTOR_PRIVILEGES } from '@/constants';
import { batchUpdateSpots } from '@/api-client/truck';
import { isTeamLeader } from '@/utils/user';
import type { GarageTruck } from '@/components/production/garage/garage-view';

export default function GaragesScreen() {
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check privileges - only ADMIN, LOGISTIC, or team leaders can edit positions
  const { isAdmin, user, canAccess } = usePrivileges();
  const userIsTeamLeader = isTeamLeader(user);
  const canEditGaragePositions = isAdmin || userIsTeamLeader || canAccess([SECTOR_PRIVILEGES.LOGISTIC]);

  // Fetch tasks with trucks AND their layouts for dimensions
  const { data: tasksResponse, isLoading, error, refetch } = useTasks({
    page: 1,
    limit: 100,
    include: {
      truck: {
        include: {
          leftSideLayout: {
            include: {
              layoutSections: true,
            },
          },
          rightSideLayout: {
            include: {
              layoutSections: true,
            },
          },
        },
      },
      generalPainting: true,
    },
  });

  // Transform tasks to garage trucks format
  const garageTrucks = useMemo(() => {
    if (!tasksResponse?.data) return [];

    return tasksResponse.data
      .filter((task) => {
        if (!task.truck) return false;
        return task.status === TASK_STATUS.IN_PRODUCTION || task.status === TASK_STATUS.WAITING_PRODUCTION;
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

        // Add cabin if needed (trucks < 10m get 1.8m cabin - average Brazilian truck cab)
        const CABIN_THRESHOLD = 10;
        const CABIN_LENGTH = 1.8;
        const truckLength = sectionsSum > 0
          ? (sectionsSum < CABIN_THRESHOLD ? sectionsSum + CABIN_LENGTH : sectionsSum)
          : 10; // Default 10m if no sections

        return {
          id: task.id,
          truckId: truck?.id,
          spot: truck?.spot || null,
          taskName: task.name,
          serialNumber: (task as any).serialNumber || null,
          paintHex: (task.generalPainting as any)?.hex || null,
          length: truckLength,
          originalLength: sectionsSum > 0 ? sectionsSum : undefined,
        };
      });
  }, [tasksResponse]);

  // Handle batch save of all spot changes using single API call
  const handleSaveChanges = useCallback(
    async (changes: Array<{ truckId: string; newSpot: TRUCK_SPOT }>) => {
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
        .filter((u): u is { truckId: string; spot: TRUCK_SPOT } => u !== null);

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

  if (isLoading && !isRefreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
        <Card style={{ padding: 16, alignItems: 'center' }}>
          <Skeleton style={{ height: 450, width: '100%', maxWidth: 400, borderRadius: 8 }} />
        </Card>
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
