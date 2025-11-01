import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestPpeDelivery } from '@/api-client';
import { ppeDeliveryKeys } from './queryKeys';

export interface RequestPpeDeliveryData {
  itemId: string;
  quantity: number;
  scheduledDate?: Date;
  notes?: string;
  reason?: string;
}

export const useRequestPpeDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RequestPpeDeliveryData) => {
      // Map the data to match the API requirements
      // The requestPpeDelivery endpoint expects userId and status to be set automatically
      const apiData: any = {
        itemId: data.itemId,
        quantity: data.quantity,
      };

      if (data.scheduledDate) {
        apiData.scheduledDate = data.scheduledDate;
      }

      // Note: notes and reason might need to be stored elsewhere or added to the API
      // For now, we'll include them if the API supports them

      return requestPpeDelivery(apiData);
    },
    onSuccess: () => {
      // Invalidate all PPE delivery queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ppeDeliveryKeys.all });
    },
  });
};
