// Mobile preferences hook — fetches (and lazily creates) the current user's
// Preferences record. Used by useDashboardLayout to read/write
// dashboardLayoutMobile. Mirrors the web's useMyPreferences shape.

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { preferencesService } from "@/api-client/preferences";
import { preferencesKeys } from "@/hooks/queryKeys";
import type { Preferences } from "@/types";

export function useMyPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const list = useQuery({
    queryKey: preferencesKeys.byUser(userId ?? ""),
    queryFn: () =>
      preferencesService.getPreferences({
        // Backend accepts userId filter even though the generated type does not
        // declare it — same workaround as the web hook.
        userId: userId ?? undefined,
        limit: 1,
      } as any),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (data: { userId: string }) =>
      preferencesService.createPreferences(data as any),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      preferencesService.updatePreferences(id, data),
  });

  const existing: Preferences | undefined = list.data?.data?.[0];
  const hasExisting = !!existing;
  const hasResolvedQuery = list.isSuccess || list.isError;

  // Bootstrap: lazy-create a Preferences row on first sign-in so the
  // dashboard hook always has somewhere to PATCH dashboardLayoutMobile.
  const creationAttempted = useRef(false);
  useEffect(() => {
    if (!userId) return;
    if (!hasResolvedQuery) return;
    if (hasExisting) return;
    if (creationAttempted.current) return;
    if (createMutation.isPending) return;
    creationAttempted.current = true;
    createMutation
      .mutateAsync({ userId })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
      })
      .catch((err: unknown) => {
        const status =
          (err as { statusCode?: number; response?: { status?: number } })
            ?.statusCode ??
          (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          // Another session created the record first; refetch & move on.
          queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
          return;
        }
        creationAttempted.current = false;
      });
  }, [userId, hasResolvedQuery, hasExisting, createMutation, queryClient]);

  const updateMine = useMemo(() => {
    return async (data: any) => {
      if (!existing?.id) {
        throw new Error("Preferências do usuário ainda não estão disponíveis.");
      }
      const res = await updateMutation.mutateAsync({ id: existing.id, data });
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
      return res;
    };
  }, [existing?.id, updateMutation, queryClient]);

  return {
    preferences: existing ?? null,
    isLoading: list.isLoading || (createMutation.isPending && !hasExisting),
    isError: list.isError,
    isUpdating: updateMutation.isPending,
    updateMine,
  };
}
