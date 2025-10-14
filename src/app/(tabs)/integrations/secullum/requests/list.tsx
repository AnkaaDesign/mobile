import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, RefreshControl, StyleSheet, Alert, TouchableOpacity, Modal, TextInput } from "react-native";
import { router } from "expo-router";
import { useSecullumRequests, useSecullumApproveRequest, useSecullumRejectRequest } from '../../../../../hooks';
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
import {
  IconClockEdit,
  IconUser,
  IconCalendar,
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconAlertCircle,
} from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeAdjustmentRequest {
  Id: number;
  Data: string;
  FuncionarioId: number;
  FuncionarioNome: string;
  Entrada1: string | null;
  Saida1: string | null;
  Entrada2: string | null;
  Saida2: string | null;
  Entrada3: string | null;
  Saida3: string | null;
  Entrada1Original: string | null;
  Saida1Original: string | null;
  Entrada2Original: string | null;
  Saida2Original: string | null;
  Entrada3Original: string | null;
  Saida3Original: string | null;
  Tipo: number;
  TipoDescricao: string;
  Observacoes: string | null;
  DataSolicitacao: string;
  Versao: string;
  TipoSolicitacao?: number;
  AlteracoesFonteDados: any[];
}

export default function TimeAdjustmentRequestsListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeAdjustmentRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading, error, refetch } = useSecullumRequests(true); // Only pending requests
  const approveRequest = useSecullumApproveRequest();
  const rejectRequest = useSecullumRejectRequest();

  // Extract requests from response
  const pendingRequests = useMemo(() => {
    if (!data) return [];

    let requests: TimeAdjustmentRequest[] = [];

    if (data && typeof data === "object") {
      if ("data" in data && data.data) {
        if ("success" in data.data && "data" in data.data && Array.isArray(data.data.data)) {
          requests = data.data.data;
        } else if (Array.isArray(data.data)) {
          requests = data.data;
        }
      } else if ("success" in data && "data" in data && Array.isArray(data.data)) {
        requests = data.data;
      }
    } else if (Array.isArray(data)) {
      requests = data;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      requests = requests.filter(
        (req) =>
          req.FuncionarioNome?.toLowerCase().includes(query) ||
          req.TipoDescricao?.toLowerCase().includes(query)
      );
    }

    return requests;
  }, [data, searchQuery]);

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
  const handleApprove = useCallback(async (request: TimeAdjustmentRequest) => {
    Alert.alert(
      "Aprovar Solicitação",
      `Deseja aprovar a solicitação de ${request.FuncionarioNome}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Aprovar",
          onPress: async () => {
            try {
              await approveRequest.mutateAsync({
                requestId: request.Id.toString(),
                data: {
                  Versao: request.Versao,
                  AlteracoesFonteDados: request.AlteracoesFonteDados,
                  TipoSolicitacao: request.TipoSolicitacao || 0,
                },
              });
              await refetch();
              setDetailsModalVisible(false);
              setSelectedRequest(null);
            } catch (error) {
              // Error handled by hook
            }
          },
        },
      ]
    );
  }, [approveRequest, refetch]);

  // Handle reject request
  const handleReject = useCallback(async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    try {
      await rejectRequest.mutateAsync({
        requestId: selectedRequest.Id.toString(),
        data: {
          Versao: selectedRequest.Versao,
          MotivoDescarte: rejectReason,
          TipoSolicitacao: selectedRequest.TipoSolicitacao || 0,
        },
      });
      await refetch();
      setRejectModalVisible(false);
      setDetailsModalVisible(false);
      setRejectReason("");
      setSelectedRequest(null);
    } catch (error) {
      // Error handled by hook
    }
  }, [selectedRequest, rejectReason, rejectRequest, refetch]);

  // Open details modal
  const openDetailsModal = (request: TimeAdjustmentRequest) => {
    setSelectedRequest(request);
    setDetailsModalVisible(true);
  };

  // Check if time entry changed
  const hasChanges = (request: TimeAdjustmentRequest): boolean => {
    const fields = ["Entrada1", "Saida1", "Entrada2", "Saida2", "Entrada3", "Saida3"];
    return fields.some((field) => {
      const original = request[`${field}Original` as keyof TimeAdjustmentRequest];
      const requested = request[field as keyof TimeAdjustmentRequest];
      return original !== requested;
    });
  };

  // Render time comparison
  const renderTimeComparison = (label: string, original: string | null, requested: string | null) => {
    const hasChange = original !== requested;
    if (!original && !requested) return null;

    return (
      <View style={styles.timeComparisonRow}>
        <ThemedText style={styles.timeLabel}>{label}:</ThemedText>
        <View style={styles.timeValues}>
          <View style={styles.timeValue}>
            <ThemedText style={styles.timeValueLabel}>Original</ThemedText>
            <ThemedText style={styles.timeValueText}>{original || "-"}</ThemedText>
          </View>
          <IconClock size={16} color="#6B7280" />
          <View style={styles.timeValue}>
            <ThemedText style={styles.timeValueLabel}>Solicitado</ThemedText>
            <ThemedText
              style={[
                styles.timeValueText,
                hasChange && styles.timeValueChanged,
              ]}
            >
              {requested || "-"}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  // Render request item
  const renderRequest = ({ item }: { item: TimeAdjustmentRequest }) => (
    <TouchableOpacity onPress={() => openDetailsModal(item)} activeOpacity={0.7}>
      <Card style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <IconUser size={18} color="#3B82F6" />
            <ThemedText style={styles.userName}>{item.FuncionarioNome}</ThemedText>
          </View>
          <Badge variant="secondary" style={styles.typeBadge}>
            <ThemedText style={styles.typeBadgeText}>{item.TipoDescricao}</ThemedText>
          </Badge>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <IconCalendar size={14} color="#6B7280" />
            <ThemedText style={styles.infoText}>
              {format(new Date(item.Data), "dd/MM/yyyy")}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <IconClock size={14} color="#6B7280" />
            <ThemedText style={styles.infoText}>
              Solicitado em {format(new Date(item.DataSolicitacao), "dd/MM/yyyy HH:mm")}
            </ThemedText>
          </View>
        </View>

        {item.Observacoes && (
          <View style={styles.observationContainer}>
            <ThemedText style={styles.observationText} numberOfLines={2}>
              {item.Observacoes}
            </ThemedText>
          </View>
        )}

        <View style={styles.cardActions}>
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              setSelectedRequest(item);
              setRejectModalVisible(true);
            }}
            style={styles.actionButton}
          >
            <IconCircleX size={16} color="#DC2626" />
            <ThemedText style={styles.rejectButtonText}>Rejeitar</ThemedText>
          </Button>
          <Button
            variant="default"
            size="sm"
            onPress={() => handleApprove(item)}
            style={styles.actionButton}
          >
            <IconCircleCheck size={16} color="white" />
            <ThemedText style={styles.approveButtonText}>Aprovar</ThemedText>
          </Button>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Erro ao carregar solicitações"
        message="Não foi possível carregar as solicitações de ajuste de ponto. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Ajustes de Ponto"
        subtitle="Gerencie solicitações de ajustes"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.filtersContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por funcionário ou tipo..."
          style={styles.searchBar}
        />

        <View style={styles.statsContainer}>
          <ThemedText style={styles.statsText}>
            {pendingRequests.length} solicitaç{pendingRequests.length !== 1 ? "ões" : "ão"} pendente{pendingRequests.length !== 1 ? "s" : ""}
          </ThemedText>
          <Button variant="ghost" size="sm" onPress={onRefresh} disabled={refreshing}>
            <IconRefresh size={16} color="#6B7280" />
          </Button>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={pendingRequests}
          renderItem={renderRequest}
          keyExtractor={(item) => item.Id.toString()}
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
              title="Nenhuma solicitação pendente"
              description={
                searchQuery
                  ? "Não há solicitações para a busca realizada."
                  : "Não há solicitações de ajuste de ponto pendentes."
              }
              icon="clock-edit"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Detalhes da Solicitação</ThemedText>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <ThemedText style={styles.detailLabel}>Funcionário</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedRequest.FuncionarioNome}
                  </ThemedText>
                </View>

                <View style={styles.detailSection}>
                  <ThemedText style={styles.detailLabel}>Data do Ponto</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {format(new Date(selectedRequest.Data), "dd/MM/yyyy")}
                  </ThemedText>
                </View>

                <View style={styles.detailSection}>
                  <ThemedText style={styles.detailLabel}>Tipo</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedRequest.TipoDescricao}
                  </ThemedText>
                </View>

                {selectedRequest.Observacoes && (
                  <View style={styles.detailSection}>
                    <ThemedText style={styles.detailLabel}>Observação</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {selectedRequest.Observacoes}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.divider} />

                <ThemedText style={styles.sectionTitle}>Comparação de Marcações</ThemedText>

                {renderTimeComparison("Entrada 1", selectedRequest.Entrada1Original, selectedRequest.Entrada1)}
                {renderTimeComparison("Saída 1", selectedRequest.Saida1Original, selectedRequest.Saida1)}
                {renderTimeComparison("Entrada 2", selectedRequest.Entrada2Original, selectedRequest.Entrada2)}
                {renderTimeComparison("Saída 2", selectedRequest.Saida2Original, selectedRequest.Saida2)}
                {renderTimeComparison("Entrada 3", selectedRequest.Entrada3Original, selectedRequest.Entrada3)}
                {renderTimeComparison("Saída 3", selectedRequest.Saida3Original, selectedRequest.Saida3)}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => {
                  setDetailsModalVisible(false);
                  if (selectedRequest) {
                    setRejectModalVisible(true);
                  }
                }}
                style={styles.modalActionButton}
              >
                <IconCircleX size={18} color="#DC2626" />
                <ThemedText style={styles.rejectButtonText}>Rejeitar</ThemedText>
              </Button>
              <Button
                variant="default"
                onPress={() => selectedRequest && handleApprove(selectedRequest)}
                style={styles.modalActionButton}
              >
                <IconCircleCheck size={18} color="white" />
                <ThemedText style={styles.approveButtonText}>Aprovar</ThemedText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Rejeitar Solicitação</ThemedText>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <ThemedText style={styles.closeButton}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.alertBox}>
                <IconAlertCircle size={20} color="#DC2626" />
                <ThemedText style={styles.alertText}>
                  Informe o motivo da rejeição. Esta ação não pode ser desfeita.
                </ThemedText>
              </View>

              <ThemedText style={styles.inputLabel}>Motivo da Rejeição</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Descreva o motivo da rejeição..."
                placeholderTextColor="#9CA3AF"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectReason("");
                }}
                style={styles.modalActionButton}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </Button>
              <Button
                variant="destructive"
                onPress={handleReject}
                disabled={!rejectReason.trim() || rejectRequest.isPending}
                style={styles.modalActionButton}
              >
                <IconCircleX size={18} color="white" />
                <ThemedText style={styles.approveButtonText}>
                  {rejectRequest.isPending ? "Rejeitando..." : "Confirmar"}
                </ThemedText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  typeBadge: {
    backgroundColor: "#EEF2FF",
    borderColor: "#818CF8",
  },
  typeBadgeText: {
    color: "#4F46E5",
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
  },
  observationContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginBottom: 12,
  },
  observationText: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButtonText: {
    color: "#DC2626",
    fontWeight: "500",
  },
  approveButtonText: {
    color: "white",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    fontSize: 24,
    color: "#6B7280",
    paddingHorizontal: 8,
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  timeComparisonRow: {
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  timeValues: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  timeValue: {
    flex: 1,
    alignItems: "center",
  },
  timeValueLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  timeValueText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  timeValueChanged: {
    color: "#059669",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: "#DC2626",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 100,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "500",
  },
});
