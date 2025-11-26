import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useSecullumRequests, useSecullumApproveRequest, useSecullumRejectRequest } from "@/hooks/secullum";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Header } from "@/components/ui/header";
import { IconUser, IconCalendar, IconRefresh, IconCircleCheck, IconCircleX, IconClock } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
}

export default function RequisitionsListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeAdjustmentRequest | null>(null);
  const [showPending, setShowPending] = useState(true);

  // Fetch time adjustment requests
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useSecullumRequests(showPending);

  // Mutations for approve/reject
  const approveMutation = useSecullumApproveRequest();
  const rejectMutation = useSecullumRejectRequest();

  // Transform and filter requests
  const requests = useMemo(() => {
    if (!requestsData?.data || !Array.isArray(requestsData.data)) return [];

    let items = requestsData.data.map((request: any, index: number) => ({
      id: request.id || `request-${index}`,
      employeeName: request.employeeName || request.NomeFuncionario || request.FuncionarioNome || "Funcionário não identificado",
      date: request.date || request.Data || "",
      originalEntry: request.originalEntry || request.EntradaOriginal || request.Entrada1Original,
      requestedEntry: request.requestedEntry || request.EntradaSolicitada || request.Entrada1,
      originalExit: request.originalExit || request.SaidaOriginal || request.Saida1Original,
      requestedExit: request.requestedExit || request.SaidaSolicitada || request.Saida1,
      justification: request.justification || request.Justificativa || request.Observacoes || "",
      status: request.status || request.Status || request.Estado === 0 ? "pending" : request.Estado === 1 ? "approved" : "rejected",
      createdAt: request.createdAt || request.DataCriacao || request.DataSolicitacao || "",
      type: request.type || request.Tipo || request.TipoDescricao || "Ajuste de ponto",
    }));

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
    } catch (error) {
      console.error("Error refreshing requests:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle approve request
  const handleApprove = useCallback((request: TimeAdjustmentRequest) => {
    Alert.alert(
      "Aprovar Requisição",
      `Deseja aprovar a requisição de ${request.employeeName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aprovar",
          style: "default",
          onPress: async () => {
            try {
              await approveMutation.mutateAsync({
                requestId: request.id,
                data: {},
              });
              Alert.alert("Sucesso", "Requisição aprovada com sucesso!");
              setSelectedRequest(null);
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível aprovar a requisição. Tente novamente.");
            }
          },
        },
      ]
    );
  }, [approveMutation, refetch]);

  // Handle reject request
  const handleReject = useCallback((request: TimeAdjustmentRequest) => {
    Alert.alert(
      "Rejeitar Requisição",
      `Deseja rejeitar a requisição de ${request.employeeName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectMutation.mutateAsync({
                requestId: request.id,
                data: {},
              });
              Alert.alert("Sucesso", "Requisição rejeitada com sucesso!");
              setSelectedRequest(null);
              await refetch();
            } catch (error) {
              Alert.alert("Erro", "Não foi possível rejeitar a requisição. Tente novamente.");
            }
          },
        },
      ]
    );
  }, [rejectMutation, refetch]);

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

        {item.type && (
          <View style={styles.typeContainer}>
            <IconClock size={14} color="#6B7280" />
            <ThemedText style={styles.typeText}>{item.type}</ThemedText>
          </View>
        )}

        <View style={styles.timeChangesContainer}>
          {(item.originalEntry || item.requestedEntry) && (
            <View style={styles.timeChangeRow}>
              <ThemedText style={styles.timeChangeLabel}>Entrada:</ThemedText>
              <View style={styles.timeChangeValues}>
                <ThemedText style={styles.originalTime}>{item.originalEntry || "—"}</ThemedText>
                <ThemedText style={styles.arrow}>→</ThemedText>
                <ThemedText style={styles.requestedTime}>{item.requestedEntry || "—"}</ThemedText>
              </View>
            </View>
          )}
          {(item.originalExit || item.requestedExit) && (
            <View style={styles.timeChangeRow}>
              <ThemedText style={styles.timeChangeLabel}>Saída:</ThemedText>
              <View style={styles.timeChangeValues}>
                <ThemedText style={styles.originalTime}>{item.originalExit || "—"}</ThemedText>
                <ThemedText style={styles.arrow}>→</ThemedText>
                <ThemedText style={styles.requestedTime}>{item.requestedExit || "—"}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {item.justification && (
          <View style={styles.justificationContainer}>
            <ThemedText style={styles.justificationLabel}>Justificativa:</ThemedText>
            <ThemedText style={styles.justificationText} numberOfLines={2}>
              {item.justification}
            </ThemedText>
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
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar requisições"
        message="Não foi possível carregar as requisições. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Requisições de Ponto"
        subtitle="Aprovar ou rejeitar requisições"
        showBackButton
        onBackPress={() => router.back()}
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
    flexShrink: 1,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
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
