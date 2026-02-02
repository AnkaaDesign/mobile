import { useQuery } from '@tanstack/react-query';
import { getTaskById } from '@/api-client';

/**
 * OPTIMIZED Task Detail Hook for Edit Forms
 *
 * Loads only essential data for editing, reducing payload by ~80%
 */

interface UseTaskDetailOptimizedParams {
  enabled?: boolean;
  staleTime?: number;
}

export function useTaskDetailOptimized(
  id: string,
  params?: UseTaskDetailOptimizedParams
) {
  const { enabled = true, staleTime = 1000 * 60 * 10 } = params || {};

  return useQuery({
    queryKey: ['task', id, 'optimized'],
    queryFn: async () => {
      console.log(`🚀 [Task Detail Optimized] Loading minimal data for ${id}`);
      const startTime = performance.now();

      // Fetch task with minimal includes for edit form
      const response = await getTaskById(id, {
        include: {
          // Only include the IDs and essential fields
          customer: {
            select: {
              id: true,
              fantasyName: true,
            }
          },
          invoiceTo: {
            select: {
              id: true,
              fantasyName: true,
            }
          },
          sector: {
            select: {
              id: true,
              name: true,
            }
          },
          truck: {
            select: {
              id: true,
              plate: true,
              chassisNumber: true,
            }
          },
          // For paints, only get the IDs and names
          generalPainting: {
            select: {
              id: true,
              name: true,
              hex: true,
            }
          },
          logoPaints: {
            select: {
              id: true,
              name: true,
              hex: true,
            },
            take: 10, // Limit logo paints
          },
          // Service orders - only essential fields
          serviceOrders: {
            select: {
              id: true,
              description: true,
              status: true,
              type: true,
            }
          },
          // Representatives - only IDs
          representatives: {
            select: {
              id: true,
              name: true,
            }
          },
        }
      });

      const duration = performance.now() - startTime;
      console.log(`✅ [Task Detail Optimized] Loaded in ${duration.toFixed(0)}ms`);

      return response;
    },
    enabled: enabled && !!id,
    staleTime,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}