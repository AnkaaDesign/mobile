import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useCutsInfiniteMobile, useCutMutations } from "@/hooks";
import { CutsTable } from "@/components/production/cuts/list/cuts-table";
import { CutRequestModal } from "@/components/production/cuts/form/cut-request-modal";
import { hasPrivilege } from "@/utils";
import { SECTOR_PRIVILEGES } from "@/constants";
import { showToast } from "@/components/ui/toast";
import type { Cut } from "@/types";

export default function CuttingListScreen() {
  const { user } = useAuth();
  const [selectedCutForRequest, setSelectedCutForRequest] = useState<Cut | null>(null);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  // Check if user can request cuts (LEADER or ADMIN)
  const canRequestCut =
    hasPrivilege(user, SECTOR_PRIVILEGES.LEADER) ||
    hasPrivilege(user, SECTOR_PRIVILEGES.ADMIN);

  // Fetch cuts with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useCutsInfiniteMobile({
    limit: 25,
    include: {
      file: true,
      task: {
        include: {
          customer: true,
        },
      },
      parentCut: {
        include: {
          file: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const cuts = data || [];
  const { delete: deleteCut } = useCutMutations();

  // Handlers
  const handleCutPress = useCallback((cutId: string) => {
    router.push(`/producao/recorte/detalhes/${cutId}`);
  }, []);

  const handleCutEdit = useCallback((cutId: string) => {
    router.push(`/producao/recorte/editar/${cutId}`);
  }, []);

  const handleCutDelete = useCallback(
    async (cutId: string) => {
      try {
        await deleteCut(cutId);
        showToast({
          message: "Corte excluído com sucesso",
          type: "success",
        });
      } catch (error) {
        showToast({
          message: "Erro ao excluir corte",
          type: "error",
        });
      }
    },
    [deleteCut]
  );

  const handleCutRequest = useCallback(
    (cutId: string) => {
      if (!canRequestCut) {
        showToast({
          message: "Você não tem permissão para solicitar cortes",
          type: "error",
        });
        return;
      }

      const cut = cuts.find((c) => c.id === cutId);
      if (!cut) {
        showToast({
          message: "Corte não encontrado",
          type: "error",
        });
        return;
      }

      setSelectedCutForRequest(cut);
      setRequestModalVisible(true);
    },
    [canRequestCut, cuts]
  );

  const handleRequestSuccess = useCallback(
    (newCuts: Cut[]) => {
      setRequestModalVisible(false);
      setSelectedCutForRequest(null);
      refetch();
    },
    [refetch]
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={styles.container}>
      <CutsTable
        cuts={cuts}
        onCutPress={handleCutPress}
        onCutEdit={handleCutEdit}
        onCutDelete={handleCutDelete}
        onCutRequest={canRequestCut ? handleCutRequest : undefined}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        refreshing={isRefetching}
        loading={isLoading}
        loadingMore={isFetchingNextPage}
        visibleColumnKeys={["status", "type", "task", "origin"]}
      />

      {/* Cut Request Modal */}
      <CutRequestModal
        visible={requestModalVisible}
        onClose={() => {
          setRequestModalVisible(false);
          setSelectedCutForRequest(null);
        }}
        cutItem={selectedCutForRequest}
        onSuccess={handleRequestSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
