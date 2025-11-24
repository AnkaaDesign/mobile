import { useMemo } from 'react';
import { Layout } from '@/components/list/Layout';
import { cutsListConfig } from '@/config/list/production/cuts';
import { useAuth } from '@/contexts/auth-context';
import { SECTOR_PRIVILEGES } from '@/constants/enums';

export default function CuttingListScreen() {
  const { user } = useAuth();

  // Create a dynamic config based on user's sector privileges
  const dynamicConfig = useMemo(() => {
    if (!user?.sector) {
      return cutsListConfig;
    }

    const { privileges, id: userSectorId, managedSectorId } = user.sector;
    const isProductionOrLeader = privileges === SECTOR_PRIVILEGES.PRODUCTION || privileges === SECTOR_PRIVILEGES.LEADER;

    // Filter out 'sectors' field for production/leader users (they have automatic filtering)
    const filteredFields = isProductionOrLeader && cutsListConfig.filters?.fields
      ? cutsListConfig.filters.fields.filter(field => field.key !== 'sectors')
      : cutsListConfig.filters?.fields;

    // Production users can only see cuts from their own sector
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
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields,
        } : undefined,
      };
    }

    // Leader users can see cuts from their sector and managed sector
    if (privileges === SECTOR_PRIVILEGES.LEADER) {
      const sectorIds = [userSectorId];
      if (managedSectorId) {
        sectorIds.push(managedSectorId);
      }
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
        filters: cutsListConfig.filters ? {
          ...cutsListConfig.filters,
          fields: filteredFields,
        } : undefined,
      };
    }

    // Other privileges (ADMIN, WAREHOUSE, etc.) can see all cuts
    return cutsListConfig;
  }, [user?.sector]);

  return <Layout config={dynamicConfig} />;
}
