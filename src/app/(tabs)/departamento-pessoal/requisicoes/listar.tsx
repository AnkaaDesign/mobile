import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSecullumRequests, useSecullumApproveRequest, useSecullumRejectRequest } from "@/hooks/secullum";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Textarea } from "@/components/ui/textarea";
import { StandardModal } from "@/components/ui/standard-modal";
import { IconUser, IconCalendar, IconX, IconCheck, IconAlertTriangle } from "@tabler/icons-react-native";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight } from "@/constants/design-system";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeAdjustmentRequest {
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
  Tipo: number;
  TipoDescricao: string;
  Estado: number;
  Observacoes: string | null;
  DataSolicitacao: string;
  AlteracoesFonteDados: any[];
  Versao: string;
  TipoSolicitacao?: number;
}

const TIME_SLOTS: { label: string; field: string }[] = [
  { label: "Entrada 1", field: "Entrada1" },
  { label: "Saída 1", field: "Saida1" },
  { label: "Entrada 2", field: "Entrada2" },
  { label: "Saída 2", field: "Saida2" },
  { label: "Entrada 3", field: "Entrada3" },
  { label: "Saída 3", field: "Saida3" },
];

// Detect genuinely changed fields vs. markings that were merely shifted to a
// different slot — only flag a field if its requested value isn't found among
// the originals (and vice-versa). Mirrors the web's detectActualChanges.
const detectActualChanges = (request: TimeAdjustmentRequest): Set<string> => {
  const changedFields = new Set<string>();

  const originalTimes = [
    request.Entrada1Original,
    request.Saida1Original,
    request.Entrada2Original,
    request.Saida2Original,
    request.Entrada3Original,
    request.Saida3Original,
  ].filter((t) => t && t !== "");

  const requestedTimes = [
    request.Entrada1,
    request.Saida1,
    request.Entrada2,
    request.Saida2,
    request.Entrada3,
    request.Saida3,
  ].filter((t) => t && t !== "");

  ["Entrada1", "Saida1", "Entrada2", "Saida2", "Entrada3", "Saida3"].forEach((field) => {
    const original = request[`${field}Original` as keyof TimeAdjustmentRequest] as string | null;
    const requested = request[field as keyof TimeAdjustmentRequest] as string | null;
    if ((!original || original === "") && (!requested || requested === "")) return;
    if (original !== requested) {
      if (requested && !originalTimes.includes(requested)) changedFields.add(field);
      else if (original && !requestedTimes.includes(original)) changedFields.add(field);
    }
  });

  return changedFields;
};

// Slots that have at least one value (original or requested), tagged as changed.
const getComparisonSlots = (request: TimeAdjustmentRequest) => {
  const changed = detectActualChanges(request);
  return TIME_SLOTS.map((s) => ({
    label: s.label,
    field: s.field,
    original: (request[`${s.field}Original` as keyof TimeAdjustmentRequest] as string | null) || "",
    requested: (request[s.field as keyof TimeAdjustmentRequest] as string | null) || "",
    isChanged: changed.has(s.field),
  })).filter((s) => s.original || s.requested);
};

const formatDateDisplay = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy - EEEE", { locale: ptBR });
  } catch {
    return dateStr;
  }
};

export default function RequisitionsListScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TimeAdjustmentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);

  // Pending requests only — the web shows a single "Ajustes Pendentes" list (no
  // pending/processed toggle).
  const { data: requestsData, isLoading, error, refetch } = useSecullumRequests(true);

  useScreenReady(!isLoading);

  const approveMutation = useSecullumApproveRequest();
  const rejectMutation = useSecullumRejectRequest();
  const busy = approveMutation.isPending || rejectMutation.isPending;

  // The list arrives at `.data.data` (axios body envelope); fall back gracefully.
  const requests: TimeAdjustmentRequest[] = useMemo(() => {
    const anyData = requestsData as any;
    const rawList: any[] = Array.isArray(anyData?.data?.data)
      ? anyData.data.data
      : Array.isArray(anyData?.data)
        ? anyData.data
        : Array.isArray(anyData)
          ? anyData
          : [];

    return rawList.map((request: any, index: number) => ({
      Id: request.Id || request.id || index,
      Data: request.Data || request.date || "",
      DataFim: request.DataFim || null,
      FuncionarioId: request.FuncionarioId || 0,
      FuncionarioNome:
        request.FuncionarioNome || request.NomeFuncionario || request.employeeName || "Funcionário não identificado",
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
      Tipo: request.Tipo || 0,
      TipoDescricao: request.TipoDescricao || request.type || "Ajuste de ponto",
      Estado: request.Estado || 0,
      Observacoes: request.Observacoes || request.justification || null,
      DataSolicitacao: request.DataSolicitacao || request.createdAt || "",
      AlteracoesFonteDados: request.AlteracoesFonteDados || [],
      Versao: request.Versao || "1",
      TipoSolicitacao: request.TipoSolicitacao || 0,
    }));
  }, [requestsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Approve directly on the card (no confirm step, matching the web).
  const handleApprove = useCallback(
    async (request: TimeAdjustmentRequest) => {
      // Secullum 400s on /Solicitacoes/Aceitar when any AlteracoesFonteDados
      // entry has Motivo: null — copy the employee's Observacoes into each.
      const motivo = (request.Observacoes && request.Observacoes.trim()) || "Aprovado";
      const alteracoes = (request.AlteracoesFonteDados ?? []).map((c: any) => ({
        ...c,
        Motivo: c?.Motivo && String(c.Motivo).trim() !== "" ? c.Motivo : motivo,
      }));

      setActingId(request.Id);
      try {
        const result = await approveMutation.mutateAsync({
          requestId: request.Id.toString(),
          data: {
            Versao: request.Versao,
            AlteracoesFonteDados: alteracoes,
            TipoSolicitacao: request.Tipo ?? 0,
            FuncionarioId: request.FuncionarioId,
            Data: request.Data,
          },
        });
        if (result?.data?.success === false) {
          Alert.alert("Erro", result.data.message || "Não foi possível aprovar a requisição.");
          return;
        }
        await refetch();
      } catch (e) {
        console.error("Error approving request:", e);
      } finally {
        setActingId(null);
      }
    },
    [approveMutation, refetch],
  );

  const openReject = useCallback((request: TimeAdjustmentRequest) => {
    setRejectReason("");
    setRejectTarget(request);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    try {
      const result = await rejectMutation.mutateAsync({
        requestId: rejectTarget.Id.toString(),
        data: {
          Versao: rejectTarget.Versao,
          // Secullum's /Solicitacoes/Descartar expects "Motivo".
          Motivo: rejectReason,
          TipoSolicitacao: rejectTarget.Tipo ?? 0,
        },
      });
      if (result?.data?.success === false) {
        Alert.alert("Erro", result.data.message || "Não foi possível rejeitar a requisição.");
        return;
      }
      setRejectTarget(null);
      setRejectReason("");
      await refetch();
    } catch (e) {
      console.error("Error rejecting request:", e);
    }
  }, [rejectTarget, rejectReason, rejectMutation, refetch]);

  const renderRequest = ({ item }: { item: TimeAdjustmentRequest }) => {
    const slots = getComparisonSlots(item);
    const isApproving = actingId === item.Id;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <IconUser size={16} color={colors.mutedForeground} />
            <ThemedText style={styles.userName} numberOfLines={1}>
              {item.FuncionarioNome}
            </ThemedText>
          </View>
          <Badge variant="outline">{item.TipoDescricao}</Badge>
        </View>

        <View style={styles.metaRow}>
          <IconCalendar size={13} color={colors.mutedForeground} />
          <ThemedText style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
            {formatDateDisplay(item.Data)}
          </ThemedText>
        </View>

        {/* Comparação de marcações */}
        {slots.length > 0 && (
          <View style={[styles.compare, { borderColor: colors.border }]}>
            <View style={[styles.compareHead, { backgroundColor: colors.muted }]}>
              <ThemedText style={[styles.chMarc, { color: colors.mutedForeground }]}>Marcação</ThemedText>
              <ThemedText style={[styles.chCol, { color: colors.mutedForeground }]}>Original</ThemedText>
              <ThemedText style={[styles.chCol, { color: colors.mutedForeground }]}>Solicitado</ThemedText>
            </View>
            {slots.map((s) => (
              <View key={s.field} style={[styles.compareRow, { borderTopColor: colors.border }]}>
                <ThemedText style={[styles.crMarc, { color: colors.foreground }]}>{s.label}</ThemedText>
                <ThemedText style={[styles.crCol, { color: colors.mutedForeground }]}>{s.original || "—"}</ThemedText>
                <ThemedText
                  style={[
                    styles.crCol,
                    s.isChanged ? { color: colors.primary, fontWeight: fontWeight.bold } : { color: colors.foreground },
                  ]}
                >
                  {s.requested || "—"}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {!!item.Observacoes && (
          <View style={styles.obs}>
            <ThemedText style={[styles.obsLabel, { color: colors.mutedForeground }]}>Observação</ThemedText>
            <ThemedText style={styles.obsText}>{item.Observacoes}</ThemedText>
          </View>
        )}

        {/* Inline actions — approve/reject act on this request directly */}
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              variant="outline"
              icon={<IconX size={18} color={colors.destructive ?? "#dc2626"} />}
              disabled={busy}
              onPress={() => openReject(item)}
            >
              <ThemedText style={[styles.actionLabel, { color: colors.destructive ?? "#dc2626" }]}>Rejeitar</ThemedText>
            </Button>
          </View>
          <View style={styles.flex}>
            <Button
              variant="default"
              icon={<IconCheck size={18} color={colors.primaryForeground} />}
              loading={isApproving}
              disabled={busy}
              onPress={() => handleApprove(item)}
            >
              <ThemedText style={[styles.actionLabel, { color: colors.primaryForeground }]}>Aprovar</ThemedText>
            </Button>
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={{ flex: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.background }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              backgroundColor: colors.card,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Skeleton style={{ height: 16, width: "60%", borderRadius: 4 }} />
            <Skeleton style={{ height: 14, width: "45%", borderRadius: 4 }} />
            <Skeleton style={{ height: 56, width: "100%", borderRadius: 6 }} />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <ErrorScreen
        message="Erro ao carregar requisições"
        detail="Não foi possível carregar as requisições. Verifique sua conexão e tente novamente."
        onRetry={refetch}
      />
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item) => item.Id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="Nenhuma solicitação pendente"
              description="As solicitações de ajuste de ponto aparecerão aqui quando enviadas."
              icon="clock-edit"
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />

      <StandardModal
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Rejeitar solicitação"
        icon={IconAlertTriangle}
        iconColor={colors.destructive}
        actions={[
          { label: "Cancelar", variant: "outline", onPress: () => setRejectTarget(null) },
          {
            label: "Rejeitar",
            variant: "destructive",
            onPress: handleReject,
            disabled: !rejectReason.trim() || rejectMutation.isPending,
            loading: rejectMutation.isPending,
          },
        ]}
      >
        {!!rejectTarget && (
          <ThemedText style={[styles.rejectSubtitle, { color: colors.mutedForeground }]}>
            Informe o motivo da rejeição da solicitação de {rejectTarget.FuncionarioNome}.
          </ThemedText>
        )}
        <Textarea
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="Descreva o motivo da rejeição..."
          minHeight={100}
        />
      </StandardModal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  listContent: { padding: spacing.sm, gap: spacing.sm },

  card: { padding: spacing.md, gap: spacing.sm },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flex: 1 },
  userName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaText: { fontSize: fontSize.xs, textTransform: "capitalize", flex: 1 },

  compare: { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  compareHead: { flexDirection: "row", paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  chMarc: { flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  chCol: { width: 84, fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  crMarc: { flex: 1, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  crCol: { width: 84, fontSize: fontSize.sm, textAlign: "center", fontVariant: ["tabular-nums"] },

  obs: { gap: 2 },
  obsLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  obsText: { fontSize: fontSize.sm },

  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  actionLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  rejectSubtitle: { fontSize: fontSize.sm, marginBottom: spacing.sm, lineHeight: 19 },
});
