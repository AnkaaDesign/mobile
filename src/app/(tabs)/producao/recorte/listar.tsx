import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { Layout } from '@/components/list/Layout';
import { cutsListConfig } from '@/config/list/production/cuts';
import { useAuth } from '@/contexts/auth-context';
import { SECTOR_PRIVILEGES, CUT_STATUS } from '@/constants/enums';
import { CutRequestModal } from '@/components/production/cuts/form/cut-request-modal';
import { canRequestCutForTask } from '@/utils/permissions/entity-permissions';
import { useFileViewer } from '@/components/file';
import { useCutMutations } from '@/hooks';
import type { Cut } from '@/types';

export default function CuttingListScreen() {
  const { user } = useAuth();
  const { actions: fileViewerActions } = useFileViewer();
  const { update } = useCutMutations();
  const [refreshKey, setRefreshKey] = useState(0);

  // Cut request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedCutForRequest, setSelectedCutForRequest] = useState<Cut | null>(null);

  // Handle cut request - open modal with selected cut
  const handleCutRequest = useCallback((cut: Cut) => {
    setSelectedCutForRequest(cut);
    setIsRequestModalOpen(true);
  }, []);

  // Handle start cut
  const handleStartCut = useCallback(async (cut: Cut) => {
    Alert.alert(
      "Iniciar Corte",
      `Deseja iniciar o corte "${cut.file?.filename || 'Recorte'}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          onPress: async () => {
            try {
              await update({
                id: cut.id,
                data: { status: CUT_STATUS.CUTTING, startedAt: new Date() },
              });
              setRefreshKey(prev => prev + 1);
            } catch (_error) {
              // API client already shows error
            }
          },
        },
      ]
    );
  }, [update]);

  // Handle complete cut
  const handleCompleteCut = useCallback(async (cut: Cut) => {
    Alert.alert(
      "Concluir Corte",
      `Deseja concluir o corte "${cut.file?.filename || 'Recorte'}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Concluir",
          onPress: async () => {
            try {
              await update({
                id: cut.id,
                data: { status: CUT_STATUS.COMPLETED, completedAt: new Date() },
              });
              setRefreshKey(prev => prev + 1);
            } catch (_error) {
              // API client already shows error
            }
          },
        },
      ]
    );
  }, [update]);

  // Handle request modal close
  const handleRequestModalClose = useCallback(() => {
    setIsRequestModalOpen(false);
    setSelectedCutForRequest(null);
  }, []);

  // Handle file cell press - open file viewer modal
  const handleFileCellPress = useCallback((cut: Cut) => {
    if (cut.file) {
      fileViewerActions.viewFile(cut.file);
    }
  }, [fileViewerActions]);

  // Create a dynamic config based on user's sector privileges
  const dynamicConfig = useMemo(() => {
    // Update columns to add onCellPress for filePreview column (thumbnail)
    const columnsWithFileCellPress = cutsListConfig.table.columns.map(column => {
      if (column.key === 'filePreview') {
        return {
          ...column,
          onCellPress: handleFileCellPress,
        };
      }
      return column;
    });

    if (!user?.sector) {
      return {
        ...cutsListConfig,
        table: {
          ...cutsListConfig.table,
          columns: columnsWithFileCellPress,
        },
      };
    }

    const { privileges, id: userSectorId } = user.sector;
    // Use user.managedSector?.id (the sector they manage)
    const managedSectorId = user.managedSector?.id;
    // Team leadership is now determined by managedSector relationship
    const isProductionOrLeader = privileges === SECTOR_PRIVILEGES.PRODUCTION || Boolean(managedSectorId);

    // Filter out 'sectorIds' field for production/leader users (they have automatic filtering)
    const filteredFields = isProductionOrLeader && cutsListConfig.filters?.fields
      ? cutsListConfig.filters.fields.filter(field => field.key !== 'sectorIds')
      : cutsListConfig.filters?.fields;

    // Build request action for team leaders and ADMIN users
    // Team leadership is now determined by managedSector relationship
    const canRequestCut = Boolean(managedSectorId) || privileges === SECTOR_PRIVILEGES.ADMIN;
    const requestAction = canRequestCut ? {
      key: 'request',
      label: 'Solicitar Recorte',
      icon: 'cut',
      variant: 'default' as const,
      visible: (cut: Cut) => {
        // ADMIN can request for any cut, team leaders only for their managed sector
        if (privileges === SECTOR_PRIVILEGES.ADMIN) return true;
        const taskSectorId = cut.task?.sectorId;
        return canRequestCutForTask(user, taskSectorId);
      },
      onPress: (cut: Cut) => {
        handleCutRequest(cut);
      },
    } : null;

    // Build start/complete actions for WAREHOUSE and ADMIN users
    const canChangeStatus = privileges === SECTOR_PRIVILEGES.WAREHOUSE || privileges === SECTOR_PRIVILEGES.ADMIN;
    const startAction = canChangeStatus ? {
      key: 'start',
      label: 'Iniciar',
      icon: 'play',
      variant: 'default' as const,
      visible: (cut: Cut) => cut.status === CUT_STATUS.PENDING,
      onPress: (cut: Cut) => {
        handleStartCut(cut);
      },
    } : null;

    const completeAction = canChangeStatus ? {
      key: 'complete',
      label: 'Concluir',
      icon: 'check',
      variant: 'default' as const,
      visible: (cut: Cut) => cut.status === CUT_STATUS.CUTTING,
      onPress: (cut: Cut) => {
        handleCompleteCut(cut);
      },
    } : null;

    // Combine all custom actions - filter out null values with type guard
    const customActions = [requestAction, startAction, completeAction].filter((action): action is NonNullable<typeof action> => action !== null);
    const actionsWithCustom = [
      ...customActions,
      ...(cutsListConfig.table.actions || []),
    ];

    // Production users can only see cuts from tasks in their own sector
    if (privileges === SECTOR_PRIVILEGES.PRODUCTION) {
      return {
        ...cutsListConfig,
        query: {
          ...cutsListConfig.query,
          where: {
            ...cutsListConfig.query.where,
            task: {
              sectorId: userSectorId,
            },
          },
        },
        table: {
          ...cutsListConfig.table,
          columns: columnsWithFileCellPress,
          actions: actionsWithCustom,
        },
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields ?? [],
        } : undefined,
      };
    }

    // Team leaders can see cuts from tasks in their MANAGED sector only
    // Team leadership is now determined by managedSector relationship
    if (managedSectorId) {
      // Only use managedSectorId - team leaders see cuts from managed sector, not their own
      const sectorIds = [managedSectorId];

      return {
        ...cutsListConfig,
        query: {
          ...cutsListConfig.query,
          where: {
            ...cutsListConfig.query.where,
            task: {
              sectorId: { in: sectorIds },
            },
          },
        },
        table: {
          ...cutsListConfig.table,
          columns: columnsWithFileCellPress,
          actions: actionsWithCustom,
        },
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields ?? [],
        } : undefined,
      };
    }

    // Other privileges (ADMIN, WAREHOUSE, etc.) can see all cuts
    // Use the same actionsWithCustom which already includes request/start/complete for appropriate users
    return {
      ...cutsListConfig,
      table: {
        ...cutsListConfig.table,
        columns: columnsWithFileCellPress,
        actions: actionsWithCustom,
      },
      filters: cutsListConfig.filters ? {
        ...cutsListConfig.filters,
        fields: filteredFields ?? [],
      } : undefined,
    };
  }, [user, handleCutRequest, handleStartCut, handleCompleteCut, handleFileCellPress]);

  return (
    <>
      <Layout config={dynamicConfig} />

      {/* Cut Request Modal */}
      <CutRequestModal
        visible={isRequestModalOpen}
        onClose={handleRequestModalClose}
        cutItem={selectedCutForRequest}
        onSuccess={() => {
          handleRequestModalClose();
        }}
      />
    </>
  );
}
