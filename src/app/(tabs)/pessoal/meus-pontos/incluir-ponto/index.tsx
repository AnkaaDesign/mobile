import { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { WebView } from "react-native-webview";
import {
  IconMapPin,
  IconHourglass,
  IconThumbUp,
  IconThumbDown,
  IconFileText,
  IconPlus,
  IconAlertTriangle,
} from "@tabler/icons-react-native";
import { ThemedView, ThemedText } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import {
  useInclusaoPontoPendencias,
  useInclusaoPontoConfig,
  useOpenInclusaoPontoComprovante,
} from "@/hooks/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

type Pendencia = {
  id: number;
  dataHora: string;
  latitude: number;
  longitude: number;
  precisao: number;
  endereco: string;
  status: 0 | 1 | 2;
  motivoRejeicao: string | null;
  foraDoPerimetro: boolean;
  fonteDadosId?: number | null;
};

function formatDataHoraShort(iso: string): string {
  const safe = iso.includes("T") ? iso.split(".")[0] : iso;
  const d = new Date(safe);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} - ${hh}:${mi}`;
}

function formatDataHoraFull(iso: string): string {
  const safe = iso.includes("T") ? iso.split(".")[0] : iso;
  const d = new Date(safe);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} - ${hh}:${mi}:${ss}`;
}

// Filled status badge — high-saturation bg + white text/icon. We had briefly
// tried a no-bg colored thumb to mimic native Secullum, but the user prefers
// the badge look now that long labels have been shortened (see REJECTION_LABELS).
const STATUS_STYLE: Record<
  0 | 1 | 2,
  { bg: string; fg: string; Icon: typeof IconHourglass }
> = {
  0: { bg: "#ea580c", fg: "#ffffff", Icon: IconHourglass }, // orange-600
  1: { bg: "#16a34a", fg: "#ffffff", Icon: IconThumbUp }, // green-600
  2: { bg: "#dc2626", fg: "#ffffff", Icon: IconThumbDown }, // red-600
};

// Some Secullum rejection messages are too long for a single-line badge.
// Map them to compact equivalents so the pill stays one line and the badge
// stays visually balanced.
const REJECTION_LABELS: Record<string, string> = {
  "Nenhuma pessoa encontrada na foto": "Nenhuma pessoa na foto",
};

// Compact a raw Secullum rejection reason for the status pill. Some reasons
// carry a trailing "por <nome>" that varies per record — e.g.
// "Batida já preenchida por Fulano de Tal" — which bloats the badge. Drop the
// suffix so it reads simply "Batida já preenchida". (The full reason, with the
// name, is still shown in the expanded "Motivo da rejeição" section.)
function compactRejection(raw: string): string {
  const m = raw.match(/^(Batida j[áa] preenchida)\b.*/i);
  if (m) return m[1];
  return REJECTION_LABELS[raw] ?? raw;
}

function statusLabel(p: Pick<Pendencia, "status" | "motivoRejeicao">): string {
  if (p.status === 0) return "Processando";
  if (p.status === 1) return "Aceita";
  const raw = (p.motivoRejeicao ?? "").trim();
  if (!raw) return "Rejeitada";
  return compactRejection(raw);
}

// Mini map preview. Same OSM.de tile provider as the capture screen — light
// style regardless of the app theme (the map lives inside a themed card).
function buildMiniMapHtml(lat: number, lon: number, precisao: number): string {
  const safeAccuracy = Math.max(1, Math.min(precisao || 5, 100));
  const tileUrl = "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
  const subdomains = "";
  const bg = "#eef2f4";
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:${bg}}
  .leaflet-control-attribution{display:none !important}
  .pulse{width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 1px rgba(59,130,246,0.45),0 2px 6px rgba(0,0,0,0.25)}
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false }).setView([${lat}, ${lon}], 18);
  L.tileLayer('${tileUrl}', { maxZoom: 20${subdomains ? ", subdomains: '" + subdomains + "'" : ''} }).addTo(map);
  L.circle([${lat}, ${lon}], { radius: ${safeAccuracy}, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(map);
  L.marker([${lat}, ${lon}], { icon: L.divIcon({ className: 'm', html: '<div class="pulse"></div>', iconSize: [16,16], iconAnchor: [8,8] }), keyboard: false }).addTo(map);
</script>
</body></html>`;
}

export default function IncluirPontoListScreen() {
  const { colors } = useTheme();
  const nav = useNav();
  const [expanded, setExpanded] = useState<number | null>(null);
  // Tracks whether the current refetch was triggered by the user's pull-down
  // gesture. Without this we'd show the RefreshControl spinner on every
  // 2.5s auto-poll while a pendência is "Processando" — exactly the noisy
  // UX the user asked us to avoid.
  const [manualRefreshing, setManualRefreshing] = useState(false);

  useInclusaoPontoConfig({ enabled: true });
  // We drive the "while processing" auto-refresh from the component (see the
  // effect below) instead of the hook's internal refetchInterval, so we don't
  // pass pollWhilePending here.
  const pendenciasQuery = useInclusaoPontoPendencias({ enabled: true });
  const openComprovante = useOpenInclusaoPontoComprovante();
  const [loadingComprovanteId, setLoadingComprovanteId] = useState<number | null>(null);

  useScreenReady(!pendenciasQuery.isLoading);

  const isLoading = pendenciasQuery.isLoading;
  const responseOk = pendenciasQuery.data?.success ?? false;
  const list = (pendenciasQuery.data?.data ?? []) as Pendencia[];
  const errorMessage = !isLoading && !responseOk ? pendenciasQuery.data?.message : null;

  const orderedList = useMemo(
    () =>
      [...list].sort(
        (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      ),
    [list],
  );

  // Auto-refresh while any entry is still "Processando" (status 0). A freshly
  // included ponto lands here as status 0 and Secullum resolves it to
  // Aceita/Rejeitada asynchronously (face-recognition + geofence checks,
  // usually 5-15s). We poll until every row reaches a terminal state so the
  // user never has to pull-to-refresh.
  //
  // Why a self-scheduling loop instead of setInterval(refetch, ...):
  // refetch() defaults to `cancelRefetch: true`, so a fixed-interval timer
  // CANCELS the in-flight request on every tick. The Secullum round-trip
  // routinely takes longer than a few seconds, so a plain interval kept
  // aborting each poll before it could finish — nothing ever completed and the
  // row stayed "Processando" until a manual pull (a single, un-cancelled
  // request). Here we await each refetch fully, THEN schedule the next, and
  // pass cancelRefetch:false so overlapping calls de-dupe rather than abort.
  // We don't flip `manualRefreshing`, so these polls stay silent (no spinner).
  const { refetch } = pendenciasQuery;
  const hasPending = useMemo(() => list.some((p) => p.status === 0), [list]);

  useEffect(() => {
    if (!hasPending) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        await refetch({ cancelRefetch: false });
      } finally {
        if (!cancelled) timeoutId = setTimeout(poll, 3000);
      }
    };
    timeoutId = setTimeout(poll, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [hasPending, refetch]);

  const goToCapture = useCallback(() => {
    nav.push(mobileRoute("/pessoal/meus-pontos/incluir-ponto/capture"));
  }, [nav]);

  const onRefresh = useCallback(async () => {
    setManualRefreshing(true);
    try {
      await pendenciasQuery.refetch();
    } finally {
      setManualRefreshing(false);
    }
  }, [pendenciasQuery]);

  const toggleExpanded = useCallback((id: number) => {
    setExpanded((prev) => (prev === id ? null : id));
  }, []);

  const handleOpenComprovante = useCallback(
    async (registroPendenciaId: number) => {
      setLoadingComprovanteId(registroPendenciaId);
      try {
        await openComprovante.mutateAsync(registroPendenciaId);
      } catch (e: any) {
        Alert.alert(
          "Erro",
          e?.response?.data?.message ?? e?.message ?? "Não foi possível abrir o comprovante.",
        );
      } finally {
        setLoadingComprovanteId(null);
      }
    },
    [openComprovante],
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ title: "Incluir Ponto", headerTitle: "Incluir Ponto" }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            // Only show the spinner for USER-initiated pulls — auto-polling
            // for pending entries runs silently in the background.
            refreshing={manualRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Primary CTA */}
        <View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={goToCapture}
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Nova Inclusão"
          >
            <IconPlus size={20} color={colors.primaryForeground} />
            <ThemedText style={[styles.ctaText, { color: colors.primaryForeground }]}>
              Nova Inclusão
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* List card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Últimos Registros</ThemedText>
          </View>

          {isLoading ? (
            <View style={styles.centeredPad}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : errorMessage ? (
            <View style={styles.centeredPad}>
              <IconAlertTriangle size={28} color="#f59e0b" />
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {errorMessage}
              </ThemedText>
            </View>
          ) : orderedList.length === 0 ? (
            <View style={styles.centeredPad}>
              <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Nenhum registro recente.
              </ThemedText>
            </View>
          ) : (
            orderedList.map((p, idx) => {
              const meta = STATUS_STYLE[p.status] ?? STATUS_STYLE[0];
              const isOpen = expanded === p.id;
              const isLast = idx === orderedList.length - 1;
              const canOpenDoc = p.status === 1 && !!p.fonteDadosId;
              const showingPdfLoader = loadingComprovanteId === p.id;
              const showDocCol = canOpenDoc || showingPdfLoader;
              const label = statusLabel(p);
              const isLongLabel = label.length > 14;
              return (
                <View
                  key={p.id}
                >
                  <View
                    style={[
                      styles.row,
                      !isLast && {
                        borderBottomColor: colors.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    {/* Document icon — only rendered (and only occupies space)
                        when the entry was accepted and a comprovante can be
                        opened. Native Secullum drops the column entirely for
                        rejected/pending rows so the location icon hugs the
                        left edge. */}
                    {showDocCol && (
                      <TouchableOpacity
                        style={styles.rowIconCol}
                        onPress={canOpenDoc ? () => handleOpenComprovante(p.id) : undefined}
                        disabled={!canOpenDoc || openComprovante.isPending}
                        accessibilityRole={canOpenDoc ? "button" : "none"}
                        accessibilityLabel="Abrir comprovante"
                      >
                        {showingPdfLoader ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <IconFileText size={20} color={colors.foreground} />
                        )}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.rowMidCol}
                      onPress={() => toggleExpanded(p.id)}
                    >
                      <View style={styles.rowMidLine}>
                        <IconMapPin size={16} color={colors.foreground} />
                        <ThemedText style={styles.rowDate}>
                          {formatDataHoraShort(p.dataHora)}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleExpanded(p.id)}
                      style={[styles.statusBadge, { backgroundColor: meta.bg }]}
                    >
                      <ThemedText
                        style={[
                          styles.statusText,
                          isLongLabel && styles.statusTextSmall,
                          { color: meta.fg },
                        ]}
                        numberOfLines={1}
                      >
                        {label}
                      </ThemedText>
                      {p.status === 0 ? (
                        // Inline-sized spinner so the Processando pill is the
                        // same height as the Aceita/Rejeitada pills (which
                        // use a 14px icon). RN's ActivityIndicator at
                        // default ("small") is taller than that.
                        <View style={styles.spinnerBox}>
                          <ActivityIndicator size="small" color={meta.fg} />
                        </View>
                      ) : (
                        <meta.Icon size={14} color={meta.fg} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {isOpen && (
                    <View
                      style={[
                        styles.expanded,
                        { backgroundColor: colors.background, borderTopColor: colors.border },
                      ]}
                    >
                      {/* Mini-map of where the ponto was recorded */}
                      <View style={styles.miniMapWrap}>
                        <WebView
                          originWhitelist={["*"]}
                          source={{ html: buildMiniMapHtml(p.latitude, p.longitude, p.precisao) }}
                          style={StyleSheet.absoluteFill}
                          scrollEnabled={false}
                          javaScriptEnabled
                          domStorageEnabled
                          androidHardwareAccelerationDisabled={false}
                        />
                      </View>

                      <View style={[styles.expandedFooter, { backgroundColor: colors.card }]}>
                        <ThemedText style={styles.expandedTime}>
                          {formatDataHoraFull(p.dataHora)}
                        </ThemedText>
                        <ThemedText
                          style={[styles.expandedDistance, { color: colors.mutedForeground }]}
                        >
                          {p.precisao.toFixed(2)} metros
                        </ThemedText>
                        <ThemedText
                          style={[styles.expandedAddr, { color: colors.mutedForeground }]}
                        >
                          {p.endereco || "—"}
                        </ThemedText>
                        {p.foraDoPerimetro && (
                          <View style={styles.warnRow}>
                            <IconAlertTriangle size={14} color="#b45309" />
                            <ThemedText style={[styles.warnText, { color: "#b45309" }]}>
                              Fora do perímetro permitido pela empresa.
                            </ThemedText>
                          </View>
                        )}
                        {p.status === 2 && p.motivoRejeicao && (
                          <View style={styles.rejectBox}>
                            <ThemedText style={styles.rejectLabel}>
                              Motivo da rejeição
                            </ThemedText>
                            <ThemedText style={styles.rejectText}>
                              {p.motivoRejeicao}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaText: { fontSize: 16, fontWeight: "600" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  centeredPad: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  rowIconCol: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMidCol: { flex: 1 },
  rowMidLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowDate: { fontSize: 15, fontWeight: "500" },
  // Filled pill badge. Compact paddings + 14px icons keep all three badge
  // states (Processando / Aceita / Rejeitada) at the same height, regardless
  // of whether the trailing element is a spinner or an icon.
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 200,
  },
  statusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  statusTextSmall: { fontSize: 11 },
  // ActivityIndicator's intrinsic size on iOS is bigger than a 14px icon, so
  // clip it to a fixed 14x14 box to keep the Processando pill visually
  // aligned with the icon-based pills.
  spinnerBox: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.7 }],
  },
  expanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  miniMapWrap: {
    height: 240,
    backgroundColor: "#f1f5f9",
    position: "relative",
  },
  expandedFooter: {
    padding: 16,
    gap: 4,
    alignItems: "center",
  },
  expandedTime: { fontSize: 18, fontWeight: "600" },
  expandedDistance: { fontSize: 15 },
  expandedAddr: { fontSize: 13, textAlign: "center" },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  warnText: { fontSize: 12, fontWeight: "500", flex: 1 },
  rejectBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    alignSelf: "stretch",
  },
  rejectLabel: { fontSize: 12, fontWeight: "600", color: "#b91c1c" },
  rejectText: { fontSize: 13, marginTop: 4 },
});
