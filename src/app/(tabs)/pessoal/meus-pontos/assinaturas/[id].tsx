import { useState, useCallback } from "react";
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
import { ThemedView, ThemedText, ErrorScreen, Button } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Modal, ModalContent } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme";
import {
  useMyAssinaturaDetail,
  useApproveMyAssinatura,
  useRejectMyAssinatura,
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
  const [pdfError, setPdfError] = useState(false);

  const { data, isLoading, error, refetch } = useMyAssinaturaDetail(
    Number.isFinite(id) ? id : undefined,
  );
  const approveMutation = useApproveMyAssinatura();
  const rejectMutation = useRejectMyAssinatura();
  useScreenReady(!isLoading);

  const body = data?.data;
  const apuracao = body?.success ? body.data : undefined;

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
    const motivo = rejectReason.trim();
    if (!motivo) {
      Alert.alert("Atenção", "Informe o motivo da reprovação.");
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
  }, [rejectMutation, id, rejectReason, nav]);

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

      {/* Reject modal — "Informe o motivo da reprovação" */}
      <Modal visible={rejectOpen} onClose={() => setRejectOpen(false)} animationType="fade">
        <ModalContent>
          <ThemedText style={styles.modalTitle}>Informe o motivo da reprovação</ThemedText>

          <View style={[styles.readonlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ThemedText style={[styles.readonlyLabel, { color: colors.primary }]}>Descrição</ThemedText>
            <ThemedText style={[styles.readonlyValue, { color: colors.foreground }]} numberOfLines={1}>
              {apuracao.descricao}
            </ThemedText>
          </View>

          <View style={[styles.readonlyField, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <ThemedText style={[styles.readonlyLabel, { color: colors.primary }]}>Período</ThemedText>
            <ThemedText style={[styles.readonlyValue, { color: colors.foreground }]}>{period}</ThemedText>
          </View>

          <ThemedText style={[styles.readonlyLabel, { color: colors.primary, marginBottom: 4 }]}>Motivo</ThemedText>
          <Textarea
            value={rejectReason}
            onChangeText={setRejectReason}
            placeholder="Descreva o motivo da reprovação"
            numberOfLines={4}
            editable={!rejectMutation.isPending}
          />

          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button
                variant="outline"
                onPress={() => setRejectOpen(false)}
                disabled={rejectMutation.isPending}
              >
                Cancelar
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button onPress={handleReject} loading={rejectMutation.isPending}>
                Enviar
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
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  readonlyField: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 2,
  },
  readonlyLabel: { fontSize: 13, fontWeight: "600" },
  readonlyValue: { fontSize: 15, fontWeight: "500" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
});
