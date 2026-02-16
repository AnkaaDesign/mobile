import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "@/api-client/message";

export function useMyMessages() {
  return useQuery({
    queryKey: ["my-messages"],
    queryFn: () => messageService.getMyMessages(),
  });
}

export function useMarkMessageAsViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageService.markAsViewed(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-messages"] });
    },
  });
}
