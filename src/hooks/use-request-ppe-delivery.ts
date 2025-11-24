import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestPpeDelivery } from '@/api-client';
import { ppeDeliveryKeys } from './queryKeys';

export interface RequestPpeDeliveryData {
  itemId: string;
  quantity: number;
  scheduledDate?: Date;
  reason: string;
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
        reason: data.reason,
      };

      if (data.scheduledDate) {
        apiData.scheduledDate = data.scheduledDate;
      }

      return requestPpeDelivery(apiData);
    },
    onSuccess: () => {
      // Invalidate all PPE delivery queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ppeDeliveryKeys.all });
    },
  });
};
