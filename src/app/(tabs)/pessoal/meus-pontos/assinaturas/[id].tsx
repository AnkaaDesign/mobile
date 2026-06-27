import { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useNav } from "@/contexts/nav";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  IconThumbUp,
  IconThumbDown,
  IconHourglass,
  IconMaximize,
  IconFileText,
} from "@tabler/icons-react-native";
import { ThemedView, ThemedText, ErrorScreen, Button, Chip } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme";
import {
  useMyAssinaturaDetail,
  useApproveMyAssinatura,
  useRejectMyAssinatura,
  useMyBatidasForDate,
} from "@/hooks/secullum";
import { APURACAO_ESTADO } from "@/types/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

const PENDING_COLOR = "#d97706"; // amber-600

// react-native-pdf is a native module (absent in Expo Go) — guard the require
// so the screen still renders (with the "open in browser" fallback) everywhere.
let Pdf: any = null;
try {
  Pdf = require("react-native-pdf").default;
} catch {
  Pdf = null;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "";
  const date = fmtDate(iso);
  const time = (iso.slice(11, 19) || "").trim();
  return time ? `${date} ${time}` : date;
}

/** The ten Secullum punch slots, in the order they appear on the cartão-ponto. */
const SLOTS = [
  { key: "entrada1", label: "Entrada 1" },
  { key: "saida1", label: "Saída 1" },
  { key: "entrada2", label: "Entrada 2" },
  { key: "saida2", label: "Saída 2" },
  { key: "entrada3", label: "Entrada 3" },
  { key: "saida3", label: "Saída 3" },
  { key: "entrada4", label: "Entrada 4" },
  { key: "saida4", label: "Saída 4" },
  { key: "entrada5", label: "Entrada 5" },
  { key: "saida5", label: "Saída 5" },
] as const;

type SlotKey = (typeof SLOTS)[number]["key"];
type DayBatidas = Partial<Record<SlotKey, string | null>>;

const SLOT_LABEL: Record<SlotKey, string> = SLOTS.reduce(
  (acc, s) => ({ ...acc, [s.key]: s.label }),
  {} as Record<SlotKey, string>,
);

/** Enumerate every day (YYYY-MM-DD) in the apuração period, inclusive. */
function enumerateDays(startIso?: string, endIso?: string): string[] {
  if (!startIso || !endIso) return [];
  const start = new Date(`${startIso.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${endIso.slice(0, 10)}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [];
  const days: string[] = [];
  for (let t = start.getTime(), guard = 0; t <= end.getTime() && guard < 400; t += 86_400_000, guard++) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/** Build the detailed motivo text from the per-day slot selections + free text. */
function composeMotivo(selections: Record<string, SlotKey[]>, freeText: string): string {
  const lines = Object.keys(selections)
    .filter((ymd) => selections[ymd]?.length)
    .sort()
    .map((ymd) => {
      const slots = SLOTS.filter((s) => selections[ymd].includes(s.key)).map((s) => s.label);
      return `• ${fmtDate(ymd)}: ${slots.join(", ")}`;
    });
  const structured = lines.length ? `Batidas incorretas:\n${lines.join("\n")}` : "";
  const free = freeText.trim();
  return [structured, free].filter(Boolean).join("\n\n");
}

function estadoMeta(estado: number, colors: { primary: string; destructive: string }) {
  switch (estado) {
    case APURACAO_ESTADO.APROVADO:
      return { label: "Aprovado", color: colors.primary, Icon: IconThumbUp };
    case APURACAO_ESTADO.REJEITADO:
      return { label: "Rejeitado", color: colors.destructive, Icon: IconThumbDown };
    default:
      return { label: "Pendente", color: PENDING_COLOR, Icon: IconHourglass };
  }
}

export default function AssinaturaDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNav();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);

  const [refreshing, setRefreshing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // Per-day map of wrong punch slots, e.g. { "2026-05-20": ["entrada1", "saida2"] }.
  const [slotSelections, setSlotSelections] = useState<Record<string, SlotKey[]>>({});
  // Day whose slot chips are currently expanded for selection.
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);

  const { data, isLoading, error, refetch } = useMyAssinaturaDetail(
    Number.isFinite(id) ? id : undefined,
  );
  const approveMutation = useApproveMyAssinatura();
  const rejectMutation = useRejectMyAssinatura();
  useScreenReady(!isLoading);

  const body = data?.data;
  const apuracao = body?.success ? body.data : undefined;

  const periodDays = useMemo(
    () => enumerateDays(apuracao?.dataInicio, apuracao?.dataFim),
    [apuracao?.dataInicio, apuracao?.dataFim],
  );

  const toggleSlot = useCallback((ymd: string, slot: SlotKey) => {
    setSlotSelections((prev) => {
      const current = prev[ymd] ?? [];
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];
      const updated = { ...prev };
      if (next.length) updated[ymd] = next;
      else delete updated[ymd];
      return updated;
    });
  }, []);

  const selectedCount = useMemo(
    () => Object.values(slotSelections).reduce((sum, slots) => sum + slots.length, 0),
    [slotSelections],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleApprove = useCallback(() => {
    Alert.alert(
      "Assinar Cartão-Ponto",
      "Confirma a assinatura (aprovação) deste cartão-ponto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Assinar",
          onPress: async () => {
            try {
              const res = await approveMutation.mutateAsync(id);
              if (res?.data?.success) {
                nav.goBack(); // interceptor already shows the success toast
              } else {
                Alert.alert("Erro", res?.data?.message || "Falha ao assinar o cartão-ponto.");
              }
            } catch {
              // interceptor already shows the error toast
            }
          },
        },
      ],
    );
  }, [approveMutation, id, nav]);

  const handleReject = useCallback(async () => {
    const motivo = composeMotivo(slotSelections, rejectReason);
    if (!motivo) {
      Alert.alert(
        "Atenção",
        "Informe o motivo da reprovação: selecione as batidas incorretas ou descreva o motivo.",
      );
      return;
    }
    try {
      const res = await rejectMutation.mutateAsync({ id, motivo });
      if (res?.data?.success) {
        setRejectOpen(false);
        nav.goBack();
      } else {
        Alert.alert("Erro", res?.data?.message || "Falha ao rejeitar o cartão-ponto.");
      }
    } catch {
      // interceptor already shows the error toast
    }
  }, [rejectMutation, id, slotSelections, rejectReason, nav]);

  if (isLoading && !refreshing) {
    return (
      <>
        <Stack.Screen options={{ title: "Detalhes" }} />
        <ThemedView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </ThemedView>
      </>
    );
  }

  if (error || !apuracao) {
    const message =
      (error as any)?.response?.data?.message ||
      body?.message ||
      (error as any)?.message ||
      "Não foi possível carregar a apuração.";
    return (
      <>
        <Stack.Screen options={{ title: "Detalhes" }} />
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <ErrorScreen message="Erro ao carregar apuração" detail={message} onRetry={handleRefresh} />
        </ThemedView>
      </>
    );
  }

  const meta = estadoMeta(apuracao.estado, colors);
  const StatusIcon = meta.Icon;
  const period = `${fmtDate(apuracao.dataInicio)} - ${fmtDate(apuracao.dataFim)}`;
  const isPending = apuracao.estado === APURACAO_ESTADO.PENDENTE;
  const isRejected = apuracao.estado === APURACAO_ESTADO.REJEITADO;

  return (
    <>
      <Stack.Screen options={{ title: "Detalhes" }} />
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {/* Title card */}
          <View style={[styles.card, styles.titleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={styles.title}>{apuracao.descricao}</ThemedText>
            <ThemedText style={[styles.titlePeriod, { color: colors.mutedForeground }]}>{period}</ThemedText>
          </View>

          {/* Informações */}
          <ThemedText style={styles.sectionLabel}>Informações</ThemedText>

          <InfoRow label="Número" value={String(apuracao.assinaturaDigitalCartaoPontoId)} colors={colors} />
          <InfoRow label="Criado em" value={fmtDateTime(apuracao.dataInclusao)} colors={colors} />

          <View style={[styles.card, styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.infoLabel, { color: colors.foreground }]}>Status</ThemedText>
            <View style={styles.statusValue}>
              <StatusIcon size={20} color={meta.color} />
              <ThemedText style={[styles.statusText, { color: meta.color }]}>{meta.label}</ThemedText>
            </View>
          </View>

          {isRejected && !!apuracao.motivo && (
            <View style={[styles.card, styles.motivoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.infoLabel, { color: colors.foreground }]}>Motivo</ThemedText>
              <ThemedText style={[styles.motivoText, { color: colors.mutedForeground }]}>
                {apuracao.motivo}
              </ThemedText>
            </View>
          )}

          {/* Cartão Ponto */}
          <ThemedText style={styles.sectionLabel}>Cartão Ponto</ThemedText>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
            {apuracao.pdfUrl ? (
              <>
                {Pdf && !pdfError ? (
                  <Pdf
                    source={{ uri: apuracao.pdfUrl, cache: true }}
                    style={[styles.pdf, { backgroundColor: colors.muted }]}
                    onError={() => setPdfError(true)}
                    trustAllCerts={false}
                  />
                ) : (
                  <View style={[styles.pdfFallback, { backgroundColor: colors.muted }]}>
                    <IconFileText size={40} color={colors.mutedForeground} />
                    <ThemedText style={{ color: colors.mutedForeground, textAlign: "center" }}>
                      Pré-visualização indisponível neste dispositivo.
                    </ThemedText>
                  </View>
                )}
                <Button
                  variant="outline"
                  icon={<IconMaximize size={18} color={colors.foreground} />}
                  onPress={() => WebBrowser.openBrowserAsync(apuracao.pdfUrl as string)}
                >
                  Abrir em tela cheia
                </Button>
              </>
            ) : (
              <ThemedText style={{ color: colors.mutedForeground }}>
                Cartão-ponto indisponível.
              </ThemedText>
            )}
          </View>

          {/* Actions (only while pending) */}
          {isPending && (
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="destructive"
                  icon={<IconThumbDown size={18} color="#fff" />}
                  onPress={() => {
                    setRejectReason("");
                    setSlotSelections({});
                    setExpandedDay(null);
                    setRejectOpen(true);
                  }}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  Reprovar
                </Button>
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  icon={<IconThumbUp size={18} color={colors.primaryForeground} />}
                  loading={approveMutation.isPending}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onPress={handleApprove}
                >
                  Aprovar
                </Button>
              </View>
            </View>
          )}
        </ScrollView>
      </ThemedView>

      {/* Reject modal */}
      <Modal visible={rejectOpen} onClose={() => setRejectOpen(false)} animationType="fade">
        <ModalContent>
          <View style={styles.modalHeader}>
            <IconThumbDown size={22} color={colors.destructive} />
            <ThemedText style={styles.modalTitle}>Reprovar Apuração</ThemedText>
          </View>

          <ThemedText style={[styles.modalSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
            {apuracao.descricao} · {period}
          </ThemedText>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Batidas com erro — builds a detailed motivo from the selected days/slots */}
            {periodDays.length > 0 && (
              <>
                <ThemedText style={[styles.motivoFieldLabel, { color: colors.primary }]}>
                  Batidas com erro {selectedCount > 0 ? `(${selectedCount})` : "(opcional)"}
                </ThemedText>
                <ThemedText style={[styles.pickerHint, { color: colors.mutedForeground }]}>
                  Toque em um dia e marque as batidas incorretas.
                </ThemedText>
                <View style={styles.dayGrid}>
                  {periodDays.map((ymd) => {
                    const count = slotSelections[ymd]?.length ?? 0;
                    const isExpanded = expandedDay === ymd;
                    const variant = isExpanded ? "primary" : count > 0 ? "destructive" : "outline";
                    return (
                      <Chip
                        key={ymd}
                        size="sm"
                        variant={variant}
                        removable={false}
                        onPress={() => setExpandedDay(isExpanded ? null : ymd)}
                        label={count > 0 ? `${ymd.slice(8, 10)} (${count})` : ymd.slice(8, 10)}
                      />
                    );
                  })}
                </View>

                {expandedDay && (
                  <DaySlotsPicker
                    date={expandedDay}
                    selected={slotSelections[expandedDay] ?? []}
                    onToggle={(slot) => toggleSlot(expandedDay, slot)}
                    colors={colors}
                  />
                )}
              </>
            )}

            <ThemedText style={[styles.motivoFieldLabel, { color: colors.primary }]}>Motivo</ThemedText>
            <Textarea
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Observações adicionais (opcional)"
              numberOfLines={4}
              editable={!rejectMutation.isPending}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                onPress={() => setRejectOpen(false)}
                disabled={rejectMutation.isPending}
              >
                Cancelar
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="destructive"
                onPress={handleReject}
                loading={rejectMutation.isPending}
              >
                Reprovar
              </Button>
            </View>
          </View>
        </ModalContent>
      </Modal>
    </>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { card: string; border: string; foreground: string; mutedForeground: string };
}) {
  return (
    <View style={[styles.card, styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={[styles.infoLabel, { color: colors.foreground }]}>{label}</ThemedText>
      <ThemedText style={[styles.infoValue, { color: colors.mutedForeground }]}>{value}</ThemedText>
    </View>
  );
}

/**
 * Renders the ten punch slots for a single day, pre-filled with the employee's
 * actual batidas so they can tap the ones that are wrong. Mounted only while a
 * day is expanded, so the batidas fetch is scoped to that day.
 */
function DaySlotsPicker({
  date,
  selected,
  onToggle,
  colors,
}: {
  date: string;
  selected: SlotKey[];
  onToggle: (slot: SlotKey) => void;
  colors: { card: string; border: string; mutedForeground: string; primary: string };
}) {
  const { data, isLoading } = useMyBatidasForDate(date);
  const batidas = (data?.data?.success ? data.data.data : undefined) as DayBatidas | undefined;

  return (
    <View style={[styles.daySlotsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ThemedText style={styles.daySlotsTitle}>{fmtDate(date)}</ThemedText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : (
        <View style={styles.slotGrid}>
          {SLOTS.map((s) => {
            const raw = batidas?.[s.key];
            const time = raw ? String(raw).slice(0, 5) : "—";
            const isSel = selected.includes(s.key);
            return (
              <Chip
                key={s.key}
                size="sm"
                variant={isSel ? "destructive" : "outline"}
                removable={false}
                onPress={() => onToggle(s.key)}
                label={`${SLOT_LABEL[s.key]} · ${time}`}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  titleCard: { alignItems: "center", gap: 6 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  titlePeriod: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  sectionLabel: { fontSize: 18, fontWeight: "700", marginTop: 4, marginBottom: -2 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { fontSize: 15, fontWeight: "600" },
  infoValue: { fontSize: 15, fontWeight: "500", flexShrink: 1, textAlign: "right" },
  statusValue: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { fontSize: 15, fontWeight: "700" },
  motivoCard: { gap: 6 },
  motivoText: { fontSize: 15, lineHeight: 21 },
  pdf: { width: "100%", height: 460, borderRadius: 8 },
  pdfFallback: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 13, fontWeight: "500", marginBottom: 16, lineHeight: 18 },
  motivoFieldLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  modalScroll: { maxHeight: 380 },
  pickerHint: { fontSize: 12, marginBottom: 8, marginTop: -2 },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  daySlotsCard: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 10, gap: 8 },
  daySlotsTitle: { fontSize: 13, fontWeight: "700" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
