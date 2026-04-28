import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useSecullumRequests, useSecullumApproveRequest, useSecullumRejectRequest } from "@/hooks/secullum";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { IconUser, IconCalendar, IconRefresh, IconCircleCheck, IconCircleX } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

// Raw Secullum solicitação payload — only the fields this screen reads/forwards.
// Keeping this lightweight on purpose; service-side DTO has the full shape.
interface SecullumSolicitacaoRaw {
  Id: number;
  Versao: string;
  Tipo: number;
  TipoDescricao?: string;
  Estado: number;
  FuncionarioNome?: string;
  SolicitanteNome?: string | null;
  Data: string;
  DataSolicitacao?: string;
  Justificativa?: string | null;
  Observacoes?: string | null;
  MotivoDescarte?: string | null;
  Entrada1?: string | null;
  Saida1?: string | null;
  Entrada1Original?: string | null;
  Saida1Original?: string | null;
  AlteracoesFonteDados?: Array<{
    Tipo: number;
    Coluna: string;
    ColunaTroca: string | null;
    Motivo: string | null;
    DescarteBatidaMovida: boolean;
  }>;
}

interface TimeAdjustmentRequest {
  id: string;
  employeeName: string;
  date: string;
  originalEntry?: string;
  requestedEntry?: string;
  originalExit?: string;
  requestedExit?: string;
  justification: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  type?: string;
  raw: SecullumSolicitacaoRaw;
}

export default function TimeAdjustmentRequestsListScreen() {
  const { colors } = useTheme();
  const { goBack } = useNavigationHistory();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeAdjustmentRequest | null>(null);
  const [showPending, setShowPending] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<TimeAdjustmentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Fetch time adjustment requests
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useSecullumRequests(showPending);

  useScreenReady(!isLoading);

  // Mutations for approve/reject
  const approveMutation = useSecullumApproveRequest();
  const rejectMutation = useSecullumRejectRequest();

  // Transform and filter requests
  const requests = useMemo<TimeAdjustmentRequest[]>(() => {
    if (!requestsData?.data || !Array.isArray(requestsData.data)) return [];

    // Map Secullum's `Estado` to our UI status. 0=pending, 1=approved, 2=rejected.
    const estadoToStatus = (estado: number): TimeAdjustmentRequest["status"] => {
      if (estado === 1) return "approved";
      if (estado === 2) return "rejected";
      return "pending";
    };

    let items: TimeAdjustmentRequest[] = (requestsData.data as SecullumSolicitacaoRaw[]).map(
      (request, index) => ({
        id: request.Id != null ? String(request.Id) : `request-${index}`,
        employeeName:
          request.FuncionarioNome || request.SolicitanteNome || "Funcionário não identificado",
        date: request.Data || "",
        // Secullum exposes Entrada1Original (the recorded clock-in) and Entrada1 (the
        // employee's requested change). Same pattern for Saida1.
        originalEntry: request.Entrada1Original ?? undefined,
        requestedEntry: request.Entrada1 ?? undefined,
        originalExit: request.Saida1Original ?? undefined,
        requestedExit: request.Saida1 ?? undefined,
        justification: request.Justificativa || request.Observacoes || "",
        status: estadoToStatus(request.Estado),
        createdAt: request.DataSolicitacao || "",
        type: request.TipoDescricao,
        raw: request,
      })
    );

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((request: TimeAdjustmentRequest) =>
        request.employeeName?.toLowerCase().includes(query) ||
        request.date?.toLowerCase().includes(query) ||
        request.justification?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [requestsData, searchQuery]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (_error) {
      console.error("Error refreshing requests:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle approve request — sends the Secullum-required Versao + AlteracoesFonteDados
  // + TipoSolicitacao (mirrors `Tipo` on the request payload).
  // Success/error feedback comes from the axios client's write-method
  // auto-toast (see api-client/axiosClient.ts), so we don't show our own
  // Alert here to avoid a duplicate notification.
  const handleApprove = useCallback((request: TimeAdjustmentRequest) => {
    Alert.alert(
      "Aprovar Requisição",
      `Deseja aprovar a requisição de ${request.employeeName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          style: "default",
          onPress: async () => {
            try {
              await approveMutation.mutateAsync({
                requestId: request.id,
                data: {
                  Versao: request.raw.Versao,
                  AlteracoesFonteDados: request.raw.AlteracoesFonteDados ?? [],
                  TipoSolicitacao: request.raw.Tipo ?? 0,
                },
              });
              setSelectedRequest(null);
            } catch (_error) {
              // Error toast is shown by axios interceptor — nothing to do here.
            }
          },
        },
      ]
    );
  }, [approveMutation]);

  // Open the reject dialog — Secullum requires a Motivo (free text).
  const handleReject = useCallback((request: TimeAdjustmentRequest) => {
    setRejectTarget(request);
    setRejectReason("");
  }, []);

  // Confirm reject — sends Versao + Motivo + TipoSolicitacao.
  // Success/error feedback is owned by the axios interceptor (see
  // api-client/axiosClient.ts). The local Alert that previously fired here
  // duplicated the toast.
  const confirmReject = useCallback(async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert("Motivo obrigatório", "Informe o motivo da rejeição.");
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        requestId: rejectTarget.id,
        data: {
          Versao: rejectTarget.raw.Versao,
          Motivo: reason,
          TipoSolicitacao: rejectTarget.raw.Tipo ?? 0,
        },
      });
      setRejectTarget(null);
      setRejectReason("");
      setSelectedRequest(null);
    } catch (_error) {
      // Error toast is shown by axios interceptor — nothing to do here.
    }
  }, [rejectMutation, rejectTarget, rejectReason]);

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy - EEEE", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovado";
      case "rejected":
        return "Rejeitado";
      default:
        return "Pendente";
    }
  };

  // Render request item
  const renderRequest = ({ item }: { item: TimeAdjustmentRequest }) => (
    <TouchableOpacity
      onPress={() => setSelectedRequest(item.id === selectedRequest?.id ? null : item)}
      activeOpacity={0.7}
    >
      <Card style={[styles.requestCard, selectedRequest?.id === item.id && styles.selectedCard]}>
        <View style={styles.requestHeader}>
          <View style={styles.dateContainer}>
            <IconCalendar size={16} color="#6B7280" />
            <ThemedText style={styles.dateText}>
              {formatDateDisplay(item.date)}
            </ThemedText>
          </View>
          <Badge variant={getStatusBadgeVariant(item.status)}>
            {getStatusLabel(item.status)}
          </Badge>
        </View>

        <View style={styles.userContainer}>
          <IconUser size={16} color="#6B7280" />
          <ThemedText style={styles.userName}>{item.employeeName}</ThemedText>
        </View>

        <View style={styles.timeChangesContainer}>
          <View style={styles.timeChangeRow}>
            <ThemedText style={styles.timeChangeLabel}>Entrada:</ThemedText>
            <View style={styles.timeChangeValues}>
              <ThemedText style={styles.originalTime}>{item.originalEntry || "—"}</ThemedText>
              <ThemedText style={styles.arrow}>→</ThemedText>
              <ThemedText style={styles.requestedTime}>{item.requestedEntry || "—"}</ThemedText>
            </View>
          </View>
          <View style={styles.timeChangeRow}>
            <ThemedText style={styles.timeChangeLabel}>Saída:</ThemedText>
            <View style={styles.timeChangeValues}>
              <ThemedText style={styles.originalTime}>{item.originalExit || "—"}</ThemedText>
              <ThemedText style={styles.arrow}>→</ThemedText>
              <ThemedText style={styles.requestedTime}>{item.requestedExit || "—"}</ThemedText>
            </View>
          </View>
        </View>

        {item.justification && (
          <View style={styles.justificationContainer}>
            <ThemedText style={styles.justificationLabel}>Justificativa:</ThemedText>
            <ThemedText style={styles.justificationText}>{item.justification}</ThemedText>
          </View>
        )}

        {selectedRequest?.id === item.id && item.status === "pending" && (
          <View style={styles.actionsContainer}>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleReject(item)}
              style={styles.rejectButton}
            >
              <IconCircleX size={16} color="#DC2626" />
              <ThemedText style={styles.rejectButtonText}>Rejeitar</ThemedText>
            </Button>
            <Button
              variant="default"
              size="sm"
              onPress={() => handleApprove(item)}
              style={styles.approveButton}
            >
              <IconCircleCheck size={16} color="#fff" />
              <ThemedText style={styles.approveButtonText}>Aprovar</ThemedText>
            </Button>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, padding: spacing.md, gap: spacing.md }}>
          {/* Filter buttons skeleton */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Skeleton width="48%" height={36} style={{ borderRadius: 8 }} />
            <Skeleton width="48%" height={36} style={{ borderRadius: 8 }} />
          </View>
          {/* Search bar skeleton */}
          <Skeleton width="100%" height={44} style={{ borderRadius: 8 }} />
          {/* Request cards skeleton */}
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width="50%" height={16} />
                <Skeleton width={80} height={22} style={{ borderRadius: 12 }} />
              </View>
              <Skeleton width="65%" height={14} />
              <View style={{ backgroundColor: colors.muted, borderRadius: 8, padding: spacing.sm, gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width="25%" height={12} />
                  <Skeleton width="40%" height={12} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width="20%" height={12} />
                  <Skeleton width="40%" height={12} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar requisições"
        message="Não foi possível carregar as requisições de ajuste de ponto. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Ajustes de Ponto"
        subtitle="Aprovar ou rejeitar requisições de ajuste"
        showBackButton
        onBackPress={() => goBack()}
      />

      <View style={styles.filtersContainer}>
        <View style={styles.toggleContainer}>
          <Button
            variant={showPending ? "default" : "outline"}
            size="sm"
            onPress={() => setShowPending(true)}
            style={styles.toggleButton}
          >
            Pendentes
          </Button>
          <Button
            variant={!showPending ? "default" : "outline"}
            size="sm"
            onPress={() => setShowPending(false)}
            style={styles.toggleButton}
          >
            Processadas
          </Button>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por funcionário, data ou justificativa..."
          style={styles.searchBar}
        />

        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {requests.length} requisição{requests.length !== 1 ? "ões" : ""} encontrada{requests.length !== 1 ? "s" : ""}
          </ThemedText>
          <Button
            variant="ghost"
            size="sm"
            onPress={onRefresh}
            disabled={refreshing}
          >
            <IconRefresh size={16} color="#6B7280" />
          </Button>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={requests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Nenhuma requisição encontrada"
              description={showPending ? "Não há requisições pendentes no momento." : "Não há requisições processadas para exibir."}
              icon="clock-edit"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Requisição</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `Informe o motivo da rejeição para a requisição de ${rejectTarget.employeeName}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <View style={{ paddingVertical: spacing.sm }}>
            <Textarea
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Motivo da rejeição..."
              numberOfLines={4}
            />
          </View>
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
            >
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button
              variant="destructive"
              onPress={confirmReject}
              disabled={rejectMutation.isPending}
            >
              <ThemedText style={{ color: "#fff" }}>
                {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}
              </ThemedText>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
  },
  searchBar: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  timeChangesContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timeChangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timeChangeLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  timeChangeValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalTime: {
    fontSize: 14,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  arrow: {
    fontSize: 14,
    color: "#6B7280",
  },
  requestedTime: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  justificationContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginBottom: 12,
  },
  justificationLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  justificationText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
  },
  rejectButton: {
    flex: 1,
    borderColor: "#DC2626",
  },
  rejectButtonText: {
    color: "#DC2626",
    marginLeft: 4,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#059669",
  },
  approveButtonText: {
    color: "#fff",
    marginLeft: 4,
  },
});
