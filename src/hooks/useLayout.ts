// packages/hooks/src/useLayout.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { layoutService, type LayoutDataWithPhoto } from '@/api-client';
import type { LayoutUpdateFormData } from '@/schemas';

// Query keys
export const layoutQueryKeys = {
  all: ["layouts"] as const,
  detail: (id: string) => ["layouts", "detail", id] as const,
  byTruck: (truckId: string) => ["layouts", "truck", truckId] as const,
  list: (options?: { includeUsage?: boolean; includeSections?: boolean }) =>
    ["layouts", "list", options] as const,
  usage: (layoutId: string) => ["layouts", "usage", layoutId] as const,
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
      return response;
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
      return response.data;
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
    mutationFn: ({ truckId, side, data, existingLayoutId }: { truckId: string; side: "left" | "right" | "back"; data: LayoutDataWithPhoto; existingLayoutId?: string }) =>
      layoutService.createOrUpdateTruckLayout(truckId, side, data, existingLayoutId),
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

// List all layouts
export const useLayoutList = (
  options?: {
    includeUsage?: boolean;
    includeSections?: boolean;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: layoutQueryKeys.list({ includeUsage: options?.includeUsage, includeSections: options?.includeSections }),
    queryFn: async () => {
      const response = await layoutService.listLayouts({
        includeUsage: options?.includeUsage,
        includeSections: options?.includeSections,
      });
      return response.data;
    },
    enabled: options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get layout usage
export const useLayoutUsage = (layoutId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: layoutQueryKeys.usage(layoutId),
    queryFn: async () => {
      const response = await layoutService.getLayoutUsage(layoutId);
      return response.data;
    },
    enabled: (options?.enabled !== false) && !!layoutId,
    staleTime: 2 * 60 * 1000,
  });
};

// Assign existing layout to truck
export const useAssignLayoutToTruck = () => {
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: ({ layoutId, truckId, side }: { layoutId: string; truckId: string; side: "left" | "right" | "back" }) =>
      layoutService.assignLayoutToTruck(layoutId, { truckId, side }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: layoutQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: layoutQueryKeys.byTruck(variables.truckId),
      });
      queryClient.invalidateQueries({
        queryKey: ["trucks", "detail", variables.truckId],
      });
      queryClient.invalidateQueries({
        queryKey: layoutQueryKeys.usage(variables.layoutId),
      });
      return response;
    },
    onError: (_error: any) => {

    },
  });

  return {
    assignLayout: assignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
  };
};

// Download SVG
export const useLayoutSVGDownload = () => {
  const downloadSVG = async (id: string, filename?: string) => {
    try {
      await layoutService.downloadSVG(id, filename);
    } catch (_error: any) {

    }
  };

  return { downloadSVG };
};
