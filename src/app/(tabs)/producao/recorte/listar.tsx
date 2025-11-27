import { useState, useMemo, useCallback } from 'react';
import { Layout } from '@/components/list/Layout';
import { cutsListConfig } from '@/config/list/production/cuts';
import { useAuth } from '@/contexts/auth-context';
import { SECTOR_PRIVILEGES } from '@/constants/enums';
import { CutRequestModal } from '@/components/production/cuts/form/cut-request-modal';
import { canRequestCutForTask } from '@/utils/permissions/entity-permissions';
import { useFileViewer } from '@/components/file';
import type { Cut } from '@/types';

export default function CuttingListScreen() {
  const { user } = useAuth();
  const { actions: fileViewerActions } = useFileViewer();

  // Cut request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedCutForRequest, setSelectedCutForRequest] = useState<Cut | null>(null);

  // Handle cut request - open modal with selected cut
  const handleCutRequest = useCallback((cut: Cut) => {
    setSelectedCutForRequest(cut);
    setIsRequestModalOpen(true);
  }, []);

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
    // Use user.managedSectorId directly (not from sector object)
    const managedSectorId = user.managedSectorId;
    const isProductionOrLeader = privileges === SECTOR_PRIVILEGES.PRODUCTION || privileges === SECTOR_PRIVILEGES.LEADER;

    // Filter out 'sectorIds' field for production/leader users (they have automatic filtering)
    const filteredFields = isProductionOrLeader && cutsListConfig.filters?.fields
      ? cutsListConfig.filters.fields.filter(field => field.key !== 'sectorIds')
      : cutsListConfig.filters?.fields;

    // Build request action for LEADER users
    const requestAction = privileges === SECTOR_PRIVILEGES.LEADER ? {
      key: 'request',
      label: 'Solicitar',
      icon: 'cut',
      variant: 'default' as const,
      visible: (cut: Cut) => {
        // Only show for cuts of tasks in managed sector
        const taskSectorId = cut.task?.sectorId;
        return canRequestCutForTask(user, taskSectorId);
      },
      onPress: (cut: Cut) => {
        handleCutRequest(cut);
      },
    } : null;

    // Add request action to existing actions if user is LEADER
    const actionsWithRequest = requestAction
      ? [requestAction, ...(cutsListConfig.table.actions || [])]
      : cutsListConfig.table.actions;

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
          actions: actionsWithRequest,
        },
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields,
        } : undefined,
      };
    }

    // Leader users can see cuts from tasks in their MANAGED sector only
    if (privileges === SECTOR_PRIVILEGES.LEADER) {
      // Only use managedSectorId - LEADER sees cuts from managed sector, not their own
      const sectorIds = managedSectorId ? [managedSectorId] : [];

      return {
        ...cutsListConfig,
        query: {
          ...cutsListConfig.query,
          where: {
            ...cutsListConfig.query.where,
            task: {
              sectorId: sectorIds.length > 0 ? { in: sectorIds } : undefined,
            },
          },
        },
        table: {
          ...cutsListConfig.table,
          columns: columnsWithFileCellPress,
          actions: actionsWithRequest,
        },
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields,
        } : undefined,
      };
    }

    // Other privileges (ADMIN, WAREHOUSE, etc.) can see all cuts
    return {
      ...cutsListConfig,
      table: {
        ...cutsListConfig.table,
        columns: columnsWithFileCellPress,
      },
    };
  }, [user, handleCutRequest, handleFileCellPress]);

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
