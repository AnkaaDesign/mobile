import { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Modal, Pressable, Dimensions } from "react-native";
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
import { Textarea } from "@/components/ui/textarea";
import {
  IconUser,
  IconCalendar,
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconWifiOff,
  IconDeviceMobile,
  IconFingerprint,
  IconQrcode,
  IconId,
  IconX
} from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { useScreenReady } from '@/hooks/use-screen-ready';


import { Skeleton } from "@/components/ui/skeleton";interface TimeAdjustmentRequest {
  Id: number;
  Data: string;
  DataFim: string | null;
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
  OrigemEntrada1: number | null;
  OrigemSaida1: number | null;
  OrigemEntrada2: number | null;
  OrigemSaida2: number | null;
  OrigemEntrada3: number | null;
  OrigemSaida3: number | null;
  Tipo: number;
  TipoDescricao: string;
  Estado: number;
  Observacoes: string | null;
  DataSolicitacao: string;
  AlteracoesFonteDados: any[];
  Versao: string;
  TipoSolicitacao?: number;
  DispositivoTipo?: 'mobile' | 'biometric' | 'qrcode' | 'card' | 'web';
  DispositivoNome?: string;
}

// Helper function to detect actual changes vs time shifts
const detectActualChanges = (request: TimeAdjustmentRequest): Set<string> => {
  const changedFields = new Set<string>();

  // Collect all original and requested time values
  const originalTimes = [
    request.Entrada1Original,
    request.Saida1Original,
    request.Entrada2Original,
    request.Saida2Original,
    request.Entrada3Original,
    request.Saida3Original
  ].filter(t => t && t !== "");

  const requestedTimes = [
    request.Entrada1,
    request.Saida1,
    request.Entrada2,
    request.Saida2,
    request.Entrada3,
    request.Saida3
  ].filter(t => t && t !== "");

  // Check each field to see if it's a genuine change or just a shift
  const fields = ['Entrada1', 'Saida1', 'Entrada2', 'Saida2', 'Entrada3', 'Saida3'];

  fields.forEach((field) => {
    const original = request[`${field}Original` as keyof TimeAdjustmentRequest] as string | null;
    const requested = request[field as keyof TimeAdjustmentRequest] as string | null;

    // Skip if both are empty
    if ((!original || original === "") && (!requested || requested === "")) {
      return;
    }

    // If values are different
    if (original !== requested) {
      // Check if the requested value exists somewhere in the original times
      // If it doesn't exist in originals, it's a genuine modification
      if (requested && !originalTimes.includes(requested)) {
        changedFields.add(field);
      }
      // If original value doesn't appear in requested times, it was removed/changed
      else if (original && !requestedTimes.includes(original)) {
        changedFields.add(field);
      }
    }
  });

  return changedFields;
};

// Get origin icon and label
const getOriginInfo = (origin: number | null | undefined) => {
  if (origin === 16) {
    return {
      icon: IconWifiOff,
      label: 'Ponto Virtual Offline',
    };
  }
  return {
    icon: IconUser,
    label: 'Solicitado pelo usuário',
  };
};

// Get device icon and label
const getDeviceInfo = (type?: string) => {
  switch (type) {
    case 'mobile':
      return { icon: IconDeviceMobile, label: 'Aplicativo móvel' };
    case 'biometric':
      return { icon: IconFingerprint, label: 'Biometria' };
    case 'qrcode':
      return { icon: IconQrcode, label: 'QR Code' };
    case 'card':
      return { icon: IconId, label: 'Cartão' };
    case 'web':
    default:
      return { icon: IconUser, label: 'Portal web' };
  }
};

export default function RequisitionsListScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeAdjustmentRequest | null>(null);
  const [showPending, setShowPending] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showDetailView, setShowDetailView] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;

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

  // Transform requests data
  const requests = useMemo(() => {
    if (!requestsData?.data || !Array.isArray(requestsData.data)) return [];

    let items: TimeAdjustmentRequest[] = requestsData.data.map((request: any, index: number) => ({
      Id: request.Id || request.id || index,
      Data: request.Data || request.date || "",
      DataFim: request.DataFim || null,
      FuncionarioId: request.FuncionarioId || 0,
      FuncionarioNome: request.FuncionarioNome || request.NomeFuncionario || request.employeeName || "Funcionário não identificado",
      Entrada1: request.Entrada1 || null,
      Saida1: request.Saida1 || null,
      Entrada2: request.Entrada2 || null,
      Saida2: request.Saida2 || null,
      Entrada3: request.Entrada3 || null,
      Saida3: request.Saida3 || null,
      Entrada1Original: request.Entrada1Original || null,
      Saida1Original: request.Saida1Original || null,
      Entrada2Original: request.Entrada2Original || null,
      Saida2Original: request.Saida2Original || null,
      Entrada3Original: request.Entrada3Original || null,
      Saida3Original: request.Saida3Original || null,
      OrigemEntrada1: request.OrigemEntrada1 || null,
      OrigemSaida1: request.OrigemSaida1 || null,
      OrigemEntrada2: request.OrigemEntrada2 || null,
      OrigemSaida2: request.OrigemSaida2 || null,
      OrigemEntrada3: request.OrigemEntrada3 || null,
      OrigemSaida3: request.OrigemSaida3 || null,
      Tipo: request.Tipo || 0,
      TipoDescricao: request.TipoDescricao || request.type || "Ajuste de ponto",
      Estado: request.Estado || 0,
      Observacoes: request.Observacoes || request.justification || null,
      DataSolicitacao: request.DataSolicitacao || request.createdAt || "",
      AlteracoesFonteDados: request.AlteracoesFonteDados || [],
      Versao: request.Versao || "1",
      TipoSolicitacao: request.TipoSolicitacao || 0,
      DispositivoTipo: request.DispositivoTipo,
      DispositivoNome: request.DispositivoNome,
    }));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter((request) =>
        request.FuncionarioNome?.toLowerCase().includes(query) ||
        request.Data?.toLowerCase().includes(query) ||
        request.Observacoes?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [requestsData, searchQuery]);

  // Auto-select first request
  useEffect(() => {
    if (requests.length > 0 && !selectedRequest) {
      setSelectedRequest(requests[0]);
      if (isTablet) {
        setShowDetailView(true);
      }
    }
  }, [requests, selectedRequest, isTablet]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle approve request
  const handleApprove = useCallback(async () => {
    if (!selectedRequest) return;

    try {
      await approveMutation.mutateAsync({
        requestId: selectedRequest.Id.toString(),
        data: {
          Versao: selectedRequest.Versao,
          AlteracoesFonteDados: selectedRequest.AlteracoesFonteDados,
          TipoSolicitacao: selectedRequest.TipoSolicitacao || 0
        }
      });

      setSelectedRequest(null);
      setShowDetailView(false);
      await refetch();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  }, [selectedRequest, approveMutation, refetch]);

  // Handle reject request
  const handleReject = useCallback(async () => {
    if (!selectedRequest || !rejectReason.trim()) return;

    try {
      await rejectMutation.mutateAsync({
        requestId: selectedRequest.Id.toString(),
        data: {
          Versao: selectedRequest.Versao,
          MotivoDescarte: rejectReason,
          TipoSolicitacao: selectedRequest.TipoSolicitacao || 0
        }
      });

      setSelectedRequest(null);
      setShowDetailView(false);
      setRejectDialogOpen(false);
      setRejectReason("");
      await refetch();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  }, [selectedRequest, rejectReason, rejectMutation, refetch]);

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy - EEEE", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  // Count actual changes
  const countChanges = (request: TimeAdjustmentRequest) => {
    return detectActualChanges(request).size;
  };

  // Render request list item
  const renderRequest = ({ item }: { item: TimeAdjustmentRequest }) => {
    const isSelected = selectedRequest?.Id === item.Id;
    const changeCount = countChanges(item);

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedRequest(item);
          if (!isTablet) {
            setShowDetailView(true);
          }
        }}
        activeOpacity={0.7}
      >
        <Card style={[
          styles.requestCard,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border
          },
          isSelected && styles.selectedCard
        ]}>
          <View style={styles.requestHeader}>
            <View style={styles.userContainer}>
              <IconUser size={16} color={isSelected ? '#fff' : colors.mutedForeground} />
              <ThemedText
                style={[
                  styles.userName,
                  { color: isSelected ? '#fff' : colors.foreground }
                ]}
                numberOfLines={1}
              >
                {item.FuncionarioNome}
              </ThemedText>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <IconCalendar size={14} color={isSelected ? 'rgba(255,255,255,0.7)' : colors.mutedForeground} />
            <ThemedText
              style={[
                styles.dateText,
                { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.mutedForeground }
              ]}
              numberOfLines={1}
            >
              {formatDateDisplay(item.Data)}
            </ThemedText>
          </View>

          {changeCount > 0 && (
            <Badge
              variant={isSelected ? "secondary" : "outline"}
              style={styles.changeBadge}
            >
              {changeCount} alteraç{changeCount === 1 ? 'ão' : 'ões'}
            </Badge>
          )}
        </Card>
      </TouchableOpacity>
    );
  };

  // Render detail view
  const renderDetailView = () => {
    if (!selectedRequest) {
      return (
        <View style={[styles.emptyDetailContainer, { backgroundColor: colors.background }]}>
          <IconClock size={48} color={colors.mutedForeground} />
          <ThemedText style={[styles.emptyDetailText, { color: colors.mutedForeground }]}>
            Selecione uma requisição para ver os detalhes
          </ThemedText>
        </View>
      );
    }

    const actualChanges = detectActualChanges(selectedRequest);
    const deviceInfo = getDeviceInfo(selectedRequest.DispositivoTipo);
    const DeviceIcon = deviceInfo.icon;

    const timeSlots = [
      { label: 'Entrada 1', field: 'Entrada1', origin: selectedRequest.OrigemEntrada1 },
      { label: 'Saída 1', field: 'Saida1', origin: selectedRequest.OrigemSaida1 },
      { label: 'Entrada 2', field: 'Entrada2', origin: selectedRequest.OrigemEntrada2 },
      { label: 'Saída 2', field: 'Saida2', origin: selectedRequest.OrigemSaida2 },
      { label: 'Entrada 3', field: 'Entrada3', origin: selectedRequest.OrigemEntrada3 },
      { label: 'Saída 3', field: 'Saida3', origin: selectedRequest.OrigemSaida3 },
    ];

    return (
      <View style={[styles.detailContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
          {!isTablet && (
            <TouchableOpacity onPress={() => setShowDetailView(false)} style={styles.backButton}>
              <IconX size={24} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View style={styles.detailHeaderContent}>
            <View style={styles.detailTitleRow}>
              <IconUser size={20} color={colors.foreground} />
              <ThemedText style={[styles.detailTitle, { color: colors.foreground }]}>
                {selectedRequest.FuncionarioNome}
              </ThemedText>
            </View>
            <View style={styles.detailSubtitleRow}>
              <IconCalendar size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.detailSubtitle, { color: colors.mutedForeground }]}>
                {formatDateDisplay(selectedRequest.Data)}
              </ThemedText>
            </View>
            {selectedRequest.DispositivoTipo && (
              <View style={styles.detailSubtitleRow}>
                <DeviceIcon size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.detailSubtitle, { color: colors.mutedForeground }]}>
                  {deviceInfo.label}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Metadata Card */}
          <Card style={[styles.metadataCard, { backgroundColor: colors.card }]}>
            <View style={styles.metadataRow}>
              <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
                Tipo de Solicitação
              </ThemedText>
              <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
                {selectedRequest.TipoDescricao}
              </ThemedText>
            </View>

            {selectedRequest.DataSolicitacao && (
              <View style={styles.metadataRow}>
                <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
                  Data da Solicitação
                </ThemedText>
                <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
                  {formatDateDisplay(selectedRequest.DataSolicitacao)}
                </ThemedText>
              </View>
            )}

            {selectedRequest.Observacoes && (
              <View style={[styles.metadataRow, styles.observationsRow]}>
                <ThemedText style={[styles.metadataLabel, { color: colors.mutedForeground }]}>
                  Observações
                </ThemedText>
                <ThemedText style={[styles.metadataValue, { color: colors.foreground }]}>
                  {selectedRequest.Observacoes}
                </ThemedText>
              </View>
            )}
          </Card>

          {/* Time Comparison Table */}
          <Card style={[styles.comparisonCard, { backgroundColor: colors.card }]}>
            <ThemedText style={[styles.comparisonTitle, { color: colors.foreground }]}>
              Comparação de Horários
            </ThemedText>

            <View style={[styles.tableHeader, { backgroundColor: colors.muted }]}>
              <ThemedText style={[styles.tableHeaderCell, styles.labelColumn, { color: colors.foreground }]}>
                Horário
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, styles.timeColumn, { color: colors.foreground }]}>
                Original
              </ThemedText>
              <ThemedText style={[styles.tableHeaderCell, styles.timeColumn, { color: colors.foreground }]}>
                Solicitado
              </ThemedText>
            </View>

            {timeSlots.map((slot, index) => {
              const originalValue = selectedRequest[`${slot.field}Original` as keyof TimeAdjustmentRequest] as string | null;
              const requestedValue = selectedRequest[slot.field as keyof TimeAdjustmentRequest] as string | null;
              const isChanged = actualChanges.has(slot.field);
              const originInfo = getOriginInfo(slot.origin);
              const OriginIcon = originInfo.icon;

              // Skip if both values are empty
              if (!originalValue && !requestedValue) return null;

              return (
                <View
                  key={slot.field}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && { backgroundColor: colors.background },
                    { borderBottomColor: colors.border }
                  ]}
                >
                  <View style={[styles.tableCell, styles.labelColumn]}>
                    <ThemedText style={[styles.tableCellText, { color: colors.foreground }]}>
                      {slot.label}
                    </ThemedText>
                  </View>

                  <View style={[styles.tableCell, styles.timeColumn]}>
                    <View style={styles.timeCellContent}>
                      {originalValue && (
                        <>
                          <OriginIcon size={14} color={colors.mutedForeground} />
                          <ThemedText style={[styles.timeValue, { color: colors.mutedForeground }]}>
                            {originalValue}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={[styles.tableCell, styles.timeColumn]}>
                    {requestedValue && (
                      <View style={[
                        styles.timeCellContent,
                        isChanged && styles.changedCell
                      ]}>
                        <ThemedText
                          style={[
                            styles.timeValue,
                            isChanged ? styles.changedText : { color: colors.foreground }
                          ]}
                        >
                          {requestedValue}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </Card>

          {/* Action Buttons */}
          {showPending && (
            <View style={styles.actionButtons}>
              <Button
                variant="outline"
                onPress={() => setRejectDialogOpen(true)}
                style={StyleSheet.flatten([styles.actionButton, styles.rejectButton])}
                disabled={rejectMutation.isPending}
              >
                <IconCircleX size={18} color="#DC2626" />
                <ThemedText style={styles.rejectButtonText}>Rejeitar</ThemedText>
              </Button>

              <Button
                variant="default"
                onPress={handleApprove}
                style={StyleSheet.flatten([styles.actionButton, styles.approveButton])}
                disabled={approveMutation.isPending}
              >
                <IconCircleCheck size={18} color="#fff" />
                <ThemedText style={styles.approveButtonText}>
                  {approveMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                </ThemedText>
              </Button>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: colors.background }}>
        <Skeleton style={{ height: 24, width: '40%', borderRadius: 4 }} />
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '70%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '50%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '60%', borderRadius: 4 }} />
        </View>
        <View style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 }}>
          <Skeleton style={{ height: 16, width: '80%', borderRadius: 4 }} />
          <Skeleton style={{ height: 16, width: '45%', borderRadius: 4 }} />
        </View>
      </View>;
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

  // Master-detail layout for tablet
  if (isTablet) {
    return (
      <ThemedView style={styles.container}>
        <Header
          title="Requisições de Ponto"
          subtitle="Aprovar ou rejeitar requisições"
          showBackButton
          onBackPress={() => router.back()}
        />

        <View style={styles.tabletContainer}>
          {/* Left Panel - List */}
          <View style={[styles.listPanel, { borderRightColor: colors.border }]}>
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
                placeholder="Buscar..."
                style={styles.searchBar}
              />

              <View style={styles.statsContainer}>
                <ThemedText style={[styles.statsText, { color: colors.mutedForeground }]}>
                  {requests.length} encontrada{requests.length !== 1 ? 's' : ''}
                </ThemedText>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={onRefresh}
                  disabled={refreshing}
                >
                  <IconRefresh size={16} color={colors.mutedForeground} />
                </Button>
              </View>
            </View>

            <FlatList
              data={requests}
              renderItem={renderRequest}
              keyExtractor={(item) => item.Id.toString()}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              }
              ListEmptyComponent={
                <EmptyState
                  title="Nenhuma requisição"
                  description={showPending ? "Não há requisições pendentes." : "Não há requisições processadas."}
                  icon="clock-edit"
                />
              }
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Right Panel - Detail */}
          <View style={styles.detailPanel}>
            {renderDetailView()}
          </View>
        </View>

        {/* Reject Modal */}
        <Modal
          visible={rejectDialogOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setRejectDialogOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                  Rejeitar Requisição
                </ThemedText>
                <TouchableOpacity onPress={() => setRejectDialogOpen(false)}>
                  <IconX size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <ThemedText style={[styles.modalLabel, { color: colors.foreground }]}>
                  Motivo da Rejeição
                </ThemedText>
                <Textarea
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Descreva o motivo da rejeição..."
                  minHeight={100}
                  style={styles.textArea}
                />
              </View>

              <View style={styles.modalFooter}>
                <Button
                  variant="outline"
                  onPress={() => setRejectDialogOpen(false)}
                  style={styles.modalButton}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onPress={handleReject}
                  disabled={!rejectReason.trim() || rejectMutation.isPending}
                  style={styles.modalButton}
                >
                  {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    );
  }

  // Mobile layout - List or Detail
  return (
    <ThemedView style={styles.container}>
      {!showDetailView ? (
        <>
          <Header
            title="Requisições de Ponto"
            subtitle="Aprovar ou rejeitar requisições"
            showBackButton
            onBackPress={() => router.back()}
          />

          <View style={[styles.filtersContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
              placeholder="Buscar por funcionário, data..."
              style={styles.searchBar}
            />

            <View style={styles.statsContainer}>
              <ThemedText style={[styles.statsText, { color: colors.mutedForeground }]}>
                {requests.length} requisição{requests.length !== 1 ? 'ões' : ''} encontrada{requests.length !== 1 ? 's' : ''}
              </ThemedText>
              <Button
                variant="ghost"
                size="sm"
                onPress={onRefresh}
                disabled={refreshing}
              >
                <IconRefresh size={16} color={colors.mutedForeground} />
              </Button>
            </View>
          </View>

          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => item.Id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
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
        </>
      ) : (
        renderDetailView()
      )}

      {/* Reject Modal */}
      <Modal
        visible={rejectDialogOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectDialogOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalOverlayTouchable}
            onPress={() => setRejectDialogOpen(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
                Rejeitar Requisição
              </ThemedText>
              <TouchableOpacity onPress={() => setRejectDialogOpen(false)}>
                <IconX size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={[styles.modalLabel, { color: colors.foreground }]}>
                Motivo da Rejeição
              </ThemedText>
              <Textarea
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Descreva o motivo da rejeição..."
                minHeight={100}
                style={styles.textArea}
              />
            </View>

            <View style={styles.modalFooter}>
              <Button
                variant="outline"
                onPress={() => setRejectDialogOpen(false)}
                style={styles.modalButton}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onPress={handleReject}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                style={styles.modalButton}
              >
                {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
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
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  listPanel: {
    width: 380,
    borderRightWidth: 1,
  },
  detailPanel: {
    flex: 1,
  },
  filtersContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
  },
  listContent: {
    padding: spacing.md,
    gap: 12,
  },
  requestCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  selectedCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    marginBottom: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    textTransform: 'capitalize',
    flex: 1,
  },
  changeBadge: {
    alignSelf: 'flex-start',
  },
  detailContainer: {
    flex: 1,
  },
  emptyDetailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyDetailText: {
    marginTop: spacing.md,
    fontSize: 16,
    textAlign: 'center',
  },
  detailHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  detailHeaderContent: {
    gap: 8,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  detailSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailSubtitle: {
    fontSize: 14,
  },
  detailContent: {
    flex: 1,
    padding: spacing.md,
  },
  metadataCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  metadataRow: {
    marginBottom: 12,
  },
  observationsRow: {
    marginBottom: 0,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
  },
  comparisonCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelColumn: {
    flex: 1,
  },
  timeColumn: {
    width: 100,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeCellContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeValue: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  changedCell: {
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changedText: {
    color: '#16A34A',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectButton: {
    borderColor: '#DC2626',
  },
  rejectButtonText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#16A34A',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: spacing.md,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 100,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
