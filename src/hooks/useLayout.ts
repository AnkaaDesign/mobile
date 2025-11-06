// packages/hooks/src/useLayout.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { layoutService } from '@/api-client';
import type { LayoutCreateFormData, LayoutUpdateFormData } from '@/schemas';

// Query keys
export const layoutQueryKeys = {
  all: ["layouts"] as const,
  detail: (id: string) => ["layouts", "detail", id] as const,
  byTruck: (truckId: string) => ["layouts", "truck", truckId] as const,
};

// Get layout by ID
export const useLayoutDetail = (
  id: string,
  options?: {
    include?: any;
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: layoutQueryKeys.detail(id),
    queryFn: async () => {
      const response = await layoutService.getById(id, {
        include: options?.include,
      });
      return response.data;
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get layouts by truck ID
export const useLayoutsByTruck = (
  truckId: string,
  options?: {
    include?: any;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: layoutQueryKeys.byTruck(truckId),
    queryFn: async () => {
      const response = await layoutService.getByTruckId(truckId, {
        include: options?.include,
      });
      return response.data.data;
    },
    enabled: (options?.enabled !== false) && !!truckId,
    staleTime: 5 * 60 * 1000,
  });
};

// Layout mutations
export const useLayoutMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: layoutService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: layoutQueryKeys.all });
      return response;
    },
    onError: (_error: any) => {

    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LayoutUpdateFormData }) => layoutService.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: layoutQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: layoutQueryKeys.detail(variables.id),
      });
      return response;
    },
    onError: (_error: any) => {

    },
  });

  const deleteMutation = useMutation({
    mutationFn: layoutService.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: layoutQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: layoutQueryKeys.detail(id),
      });
    },
    onError: (_error: any) => {

    },
  });

  const createOrUpdateTruckLayoutMutation = useMutation({
    mutationFn: ({ truckId, side, data }: { truckId: string; side: "left" | "right" | "back"; data: LayoutCreateFormData }) =>
      layoutService.createOrUpdateTruckLayout(truckId, side, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: layoutQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: layoutQueryKeys.byTruck(variables.truckId),
      });
      queryClient.invalidateQueries({
        queryKey: ["trucks", "detail", variables.truckId],
      });

      return response;
    },
    onError: (_error: any) => {

    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    createOrUpdateTruckLayout: createOrUpdateTruckLayoutMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSavingTruckLayout: createOrUpdateTruckLayoutMutation.isPending,
  };
};

// Download SVG
export const useLayoutSVGDownload = () => {
  const downloadSVG = async (id: string, filename?: string) => {
    try {
      await layoutService.downloadSVG(id, filename);
    } catch (error: any) {

    }
  };

  return { downloadSVG };
};
