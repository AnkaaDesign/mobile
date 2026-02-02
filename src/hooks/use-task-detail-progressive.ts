import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTask } from '@/api-client';

/**
 * Progressive Loading Hook for Task Details
 *
 * This hook implements a multi-phase loading strategy:
 * 1. Essential data (name, customer, status) - loads immediately
 * 2. Secondary data (services, dates, truck) - loads after essential
 * 3. Heavy data (files, artworks, pricing) - loads last
 *
 * This improves perceived performance by showing content progressively
 */

interface ProgressiveTaskDetailOptions {
  enabled?: boolean;
  staleTime?: number;
}

interface LoadingPhase {
  essential: boolean;
  secondary: boolean;
  heavy: boolean;
}

export function useTaskDetailProgressive(
  id: string,
  options?: ProgressiveTaskDetailOptions
) {
  const [currentPhase, setCurrentPhase] = useState<'essential' | 'secondary' | 'heavy'>('essential');
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>({
    essential: true,
    secondary: true,
    heavy: true,
  });

  // Phase 1: Essential data only - minimal includes for instant display
  const essentialQuery = useQuery({
    queryKey: ['task', id, 'essential'],
    queryFn: async () => {
      console.log(`🚀 [Progressive] Loading essential data for task ${id}`);
      const startTime = performance.now();

      const response = await getTask(id, {
        select: {
          id: true,
          name: true,
          type: true,
          priority: true,
          status: true,
          serialNumber: true,
          // Customer - minimal fields only
          customer: {
            select: {
              id: true,
              fantasyName: true,
            }
          },
          // Sector - just name
          sector: {
            select: {
              id: true,
              name: true,
            }
          },
          // Created by - minimal
          createdBy: {
            select: {
              id: true,
              name: true,
            }
          },
        }
      });

      const duration = performance.now() - startTime;
      console.log(`✅ [Progressive] Essential loaded in ${duration.toFixed(0)}ms`);

      return response;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 1000 * 60 * 10,
  });

  // Phase 2: Secondary data - services, dates, truck info
  const secondaryQuery = useQuery({
    queryKey: ['task', id, 'secondary'],
    queryFn: async () => {
      console.log(`🚀 [Progressive] Loading secondary data for task ${id}`);
      const startTime = performance.now();

      const response = await getTask(id, {
        select: {
          id: true,
          // Dates
          forecastDate: true,
          negotiatingDate: true,
          createdAt: true,
          updatedAt: true,
          details: true,
          // Truck info
          truck: {
            select: {
              id: true,
              plate: true,
              chassisNumber: true,
              brand: true,
              model: true,
            }
          },
          // Service orders - minimal
          serviceOrders: {
            select: {
              id: true,
              description: true,
              status: true,
              type: true,
              statusOrder: true,
            }
          },
          // Representatives
          representatives: {
            select: {
              id: true,
              name: true,
              role: true,
            }
          },
        }
      });

      const duration = performance.now() - startTime;
      console.log(`✅ [Progressive] Secondary loaded in ${duration.toFixed(0)}ms`);

      return response;
    },
    enabled: options?.enabled !== false && currentPhase !== 'essential',
    staleTime: options?.staleTime || 1000 * 60 * 10,
  });

  // Phase 3: Heavy data - files, artworks, pricing, paints
  const heavyQuery = useQuery({
    queryKey: ['task', id, 'heavy'],
    queryFn: async () => {
      console.log(`🚀 [Progressive] Loading heavy data for task ${id}`);
      const startTime = performance.now();

      const response = await getTask(id, {
        select: {
          id: true,
          // Paint data
          generalPainting: true,
          logoPaints: true,
          groundPaints: true,
          // Files
          baseFiles: {
            take: 20,
            select: {
              id: true,
              filename: true,
              size: true,
              mimetype: true,
            }
          },
          // Artworks
          artworks: {
            take: 20,
            select: {
              id: true,
              approved: true,
              file: {
                select: {
                  id: true,
                  filename: true,
                  size: true,
                }
              }
            }
          },
          // Documents
          documents: {
            take: 20,
            select: {
              id: true,
              title: true,
              file: {
                select: {
                  id: true,
                  filename: true,
                  size: true,
                }
              }
            }
          },
          // Pricing
          pricing: {
            select: {
              id: true,
              total: true,
              status: true,
              items: {
                take: 10,
                select: {
                  id: true,
                  description: true,
                  value: true,
                }
              }
            }
          },
          // Observations
          observation: {
            select: {
              id: true,
              description: true,
            }
          },
          // Cuts
          cuts: {
            select: {
              id: true,
              description: true,
              status: true,
            }
          },
          // Airbrushing
          airbrushing: {
            select: {
              id: true,
              status: true,
              description: true,
            }
          },
        }
      });

      const duration = performance.now() - startTime;
      console.log(`✅ [Progressive] Heavy data loaded in ${duration.toFixed(0)}ms`);

      return response;
    },
    enabled: options?.enabled !== false && currentPhase === 'heavy',
    staleTime: options?.staleTime || 1000 * 60 * 10,
  });

  // Progress to next phase when previous completes
  useEffect(() => {
    if (essentialQuery.isSuccess && currentPhase === 'essential') {
      console.log('📊 [Progressive] Essential complete, starting secondary');
      setCurrentPhase('secondary');
      setLoadingPhase(prev => ({ ...prev, essential: false }));
    }
  }, [essentialQuery.isSuccess, currentPhase]);

  useEffect(() => {
    if (secondaryQuery.isSuccess && currentPhase === 'secondary') {
      console.log('📊 [Progressive] Secondary complete, starting heavy');
      setCurrentPhase('heavy');
      setLoadingPhase(prev => ({ ...prev, secondary: false }));
    }
  }, [secondaryQuery.isSuccess, currentPhase]);

  useEffect(() => {
    if (heavyQuery.isSuccess) {
      console.log('📊 [Progressive] All phases complete');
      setLoadingPhase(prev => ({ ...prev, heavy: false }));
    }
  }, [heavyQuery.isSuccess]);

  // Merge data from all phases
  const mergedData = {
    ...essentialQuery.data?.data,
    ...secondaryQuery.data?.data,
    ...heavyQuery.data?.data,
  };

  // Overall loading state
  const isLoading = essentialQuery.isLoading;
  const isFullyLoaded = essentialQuery.isSuccess && secondaryQuery.isSuccess && heavyQuery.isSuccess;

  // Error from any phase
  const error = essentialQuery.error || secondaryQuery.error || heavyQuery.error;

  // Refetch all phases
  const refetch = async () => {
    setCurrentPhase('essential');
    setLoadingPhase({ essential: true, secondary: true, heavy: true });
    await Promise.all([
      essentialQuery.refetch(),
      secondaryQuery.refetch(),
      heavyQuery.refetch(),
    ]);
  };

  return {
    data: mergedData,
    isLoading,
    isFullyLoaded,
    loadingPhase,
    error,
    refetch,
    queries: {
      essential: essentialQuery,
      secondary: secondaryQuery,
      heavy: heavyQuery,
    }
  };
}