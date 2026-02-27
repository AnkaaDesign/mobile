import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMessage, batchDeleteMessages, archiveMessage, activateMessage } from "@/api-client/message";
import { messageKeys } from "./queryKeys";

/**
 * Hook providing message CRUD mutations for the list Layout component.
 * Used by messagesListConfig via mutationsHook: 'useMessageMutations'
 */
export function useMessageMutations() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });

  return {
    delete: deleteMutation.mutateAsync,
    deleteAsync: deleteMutation.mutateAsync,
    archive: archiveMutation.mutateAsync,
    activate: activateMutation.mutateAsync,
  };
}

/**
 * Hook providing batch message mutations for the list Layout component.
 * Used by messagesListConfig via batchMutationsHook: 'useMessageBatchMutations'
 */
export function useMessageBatchMutations() {
  const queryClient = useQueryClient();

  const batchDeleteMutation = useMutation({
    mutationFn: (data: { ids: string[] }) => batchDeleteMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });

  return {
    batchDeleteAsync: batchDeleteMutation.mutateAsync,
  };
}
