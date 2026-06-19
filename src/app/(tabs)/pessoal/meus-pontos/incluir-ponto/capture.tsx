import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
} from "react-native";
import { Stack } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as Application from "expo-application";
import { CameraView, useCameraPermissions } from "expo-camera";
import { FormActionBar } from "@/components/forms";
import type { CameraType } from "expo-camera";
import {
  IconAlertTriangle,
  IconRefresh,
  IconX,
  IconCrosshair,
} from "@tabler/icons-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView, ThemedText } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import {
  useInclusaoPontoConfig,
  useCreateMyInclusaoPonto,
} from "@/hooks/secullum";
import { secullumService } from "@/api-client";
import { nearestPerimeter, formatDistance } from "@/utils/distance";

type Coords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

function formatNowFull(iso?: string): string {
  const d = iso ? new Date(iso.split(".")[0]) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} - ${hh}:${mi}:${ss}`;
}

// Leaflet basemap — OpenStreetMap.de "German Style". Google-Maps-like
// coloring (orange highways, yellow primary, tan land use, blue water,
// clear black-on-white labels) and 100% free, no API key, no signup, no
// rate-limiting at our volume. We use the SAME light style on both dark
// and light app themes — the map lives inside a themed card so it stays
// visually contained, and a dark basemap was too dark in testing.
function buildMapHtml(opts: {
  lat: number;
  lon: number;
  accuracy: number;
  perimetros: Array<{ latitude?: number; longitude?: number; raio?: number }>;
}): string {
  const { lat, lon, accuracy, perimetros } = opts;
  const safeAccuracy = Math.max(1, Math.min(accuracy || 0, 500));
  const perimetrosJson = JSON.stringify(
    (perimetros || []).filter(
      (p) => typeof p.latitude === "number" && typeof p.longitude === "number",
    ),
  );
  const tileUrl = "https://tile.openstreetmap.de/{z}/{x}/{y}.png";
  const subdomains = "";
  const bg = "#eef2f4";
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map{height:100%;margin:0;padding:0;background:${bg}}
  .leaflet-control-attribution{display:none !important}
  .pulse{width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 1px rgba(59,130,246,0.45),0 2px 6px rgba(0,0,0,0.25)}
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${lat}, ${lon}], 18);
  L.tileLayer('${tileUrl}', { maxZoom: 20${subdomains ? ", subdomains: '" + subdomains + "'" : ''} }).addTo(map);
  var userIcon = L.divIcon({ className: 'user-marker', html: '<div class="pulse"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
  L.marker([${lat}, ${lon}], { icon: userIcon, keyboard: false }).addTo(map);
  L.circle([${lat}, ${lon}], { radius: ${safeAccuracy}, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }).addTo(map);
  var perimetros = ${perimetrosJson};
  perimetros.forEach(function(p){
    if (typeof p.raio === 'number') {
      L.circle([p.latitude, p.longitude], { radius: p.raio, color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.10, weight: 1.5, dashArray: '4 4' }).addTo(map);
    }
    L.circleMarker([p.latitude, p.longitude], { radius: 5, color: '#16a34a', fillColor: '#16a34a', fillOpacity: 1, weight: 2 }).addTo(map);
  });
</script>
</body></html>`;
}

export default function IncluirPontoCaptureScreen() {
  const { colors } = useTheme();
  const nav = useNav();

  const configQuery = useInclusaoPontoConfig({ enabled: true });
  const config = configQuery.data?.data;
  // The config endpoint can return HTTP 200 + { success: false, message } when
  // Secullum refuses the load (e.g. employee not registered). The hook returns
  // the full body, so detect that here and surface the real Secullum message —
  // without it the screen would silently render with no config and a dead
  // "Incluir Ponto" button.
  const configLoadFailed = configQuery.data?.success === false;
  const configErrorMessage =
    configQuery.data?.message ||
    "Não foi possível carregar a configuração de inclusão de ponto.";

  const createMutation = useCreateMyInclusaoPonto();

  // Location state
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string>("");
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [now, setNow] = useState<Date>(new Date());
  const [deviceId, setDeviceId] = useState<string>("");

  // Camera state
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Tick "now" once a second while on screen so the displayed timestamp keeps
  // up with real time (the server still sets the actual punch time).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Resolve a stable device identifier for the `identificacaoDispositivo` field.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let id: string | null;
        if (Platform.OS === "ios") {
          id = await Application.getIosIdForVendorAsync();
        } else {
          id = Application.getAndroidId();
        }
        if (!cancelled) setDeviceId(id ?? "");
      } catch {
        if (!cancelled) setDeviceId("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const acquireLocation = useCallback(async () => {
    setLocationError(null);
    setRefreshingLocation(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      setPermission(perm.status);
      if (perm.status !== Location.PermissionStatus.GRANTED) {
        setLocationError(
          "Permissão de localização negada. Habilite o GPS para incluir o ponto.",
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const next: Coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
      };
      setCoords(next);

      setAddressLoading(true);
      try {
        const res = await secullumService.reverseGeocode(next.latitude, next.longitude);
        setAddress(res.data?.data?.endereco ?? "");
      } catch {
        setAddress("");
      } finally {
        setAddressLoading(false);
      }
    } catch (e: any) {
      setLocationError(
        e?.message
          ? `Falha ao obter localização: ${e.message}`
          : "Falha ao obter localização. Tente novamente.",
      );
    } finally {
      setRefreshingLocation(false);
    }
  }, []);

  useEffect(() => {
    acquireLocation();
  }, [acquireLocation]);

  // Perimeter check against the configured authorized perimeters
  const perimeterInfo = useMemo(() => {
    if (!coords || !config) return null;
    return nearestPerimeter(coords.latitude, coords.longitude, config.perimetrosAutorizados ?? []);
  }, [coords, config]);

  const foraDoPerimetro = useMemo(() => {
    if (!config?.somentePerimetrosAutorizados) return false;
    if (!perimeterInfo) return false;
    return perimeterInfo.foraDoPerimetro;
  }, [config, perimeterInfo]);

  const handleCapturePhoto = useCallback(() => {
    setCameraVisible(true);
  }, []);

  const handleCameraCaptured = useCallback(
    (uri: string, base64: string | null) => {
      setCameraVisible(false);
      // `base64` is captured inline by the camera (much more reliable than
      // reading the file URI back as base64 — the latter flakes on iOS HEIC
      // intermediates and was the source of the "Falha ao processar a foto"
      // error). Camera URIs are also short-lived; capturing both in one step
      // means we never have to re-read the file.
      if (!base64) {
        Alert.alert("Erro", "Falha ao processar a foto. Tente novamente.");
        return;
      }
      setPhotoUri(uri);
      setPhotoBase64(base64);
    },
    [],
  );

  // W16: guard against duplicate submit on fast double-tap. Reset only on
  // error so the user can retry; on success, navigation removes the screen.
  const submittedRef = useRef(false);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    if (!coords) {
      Alert.alert("Atenção", "Aguarde a localização ser obtida.");
      return;
    }
    if (config?.exigirCapturaFotoPonto && !photoBase64) {
      // Foto é obrigatória — abre câmera direto.
      setCameraVisible(true);
      return;
    }

    submittedRef.current = true;
    try {
      const res = await createMutation.mutateAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
        precisao: coords.accuracy,
        endereco: address || null,
        photoBase64: photoBase64 ?? null,
        foraDoPerimetro,
        identificacaoDispositivo: deviceId,
        utilizaLocalizacaoFicticia: false,
      });
      const body = res?.data;
      if (body?.success) {
        // No success modal — the user lands back on the list and the new
        // pendência (with "Em processamento" → "Aceita") is visual
        // confirmation. The API client already surfaces a toast/alert for
        // any error.
        nav.replace(mobileRoute("/pessoal/meus-pontos/incluir-ponto"));
      } else {
        // W17: include validationErrors in the alert so they are never
        // silently discarded.
        const detail = [
          body?.message,
          ...(Array.isArray(body?.validationErrors)
            ? body.validationErrors
                .map((e: { message?: string }) => e.message)
                .filter(Boolean)
            : []),
        ]
          .filter(Boolean)
          .join("\n");
        Alert.alert("Erro", detail || "Falha ao incluir ponto.");
        submittedRef.current = false;
      }
    } catch (e: any) {
      // API client interceptor already shows the error toast
      submittedRef.current = false;
    }
  }, [coords, config, photoBase64, address, foraDoPerimetro, deviceId, createMutation, nav]);

  // -------------------- render --------------------

  // Reasons to block "Incluir Ponto" (final submit). Does NOT include the
  // "missing photo" case, because in that state we swap the CTA to "Tirar Foto"
  // and that button must stay enabled.
  const submitDisabled =
    !coords ||
    refreshingLocation ||
    createMutation.isPending ||
    config?.funcionarioAfastado === true ||
    configLoadFailed;

  // Reasons to block "Tirar Foto" — same as above plus camera permission UI
  // is handled inside the modal itself.
  const photoButtonDisabled =
    !coords || refreshingLocation || createMutation.isPending;

  const mapHtml = useMemo(() => {
    if (!coords) return null;
    return buildMapHtml({
      lat: coords.latitude,
      lon: coords.longitude,
      accuracy: coords.accuracy ?? 0,
      perimetros: config?.perimetrosAutorizados ?? [],
    });
  }, [coords, config?.perimetrosAutorizados]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Incluir Ponto", headerTitle: "Incluir Ponto" }} />
      <View style={styles.contentWrap}>
        {/* GPS card — fills available height */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Map */}
          <View style={[styles.mapWrap, { backgroundColor: colors.muted }]}>
            {mapHtml ? (
              <WebView
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                style={StyleSheet.absoluteFill}
                scrollEnabled={false}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                androidHardwareAccelerationDisabled={false}
                setSupportMultipleWindows={false}
              />
            ) : (
              <View style={styles.mapPlaceholder}>
                <ActivityIndicator color={colors.primary} />
                <ThemedText
                  style={[
                    styles.mapPlaceholderText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {refreshingLocation ? "Obtendo localização…" : "Aguardando GPS"}
                </ThemedText>
              </View>
            )}
            <TouchableOpacity
              onPress={acquireLocation}
              disabled={refreshingLocation}
              style={[
                styles.recenter,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              accessibilityLabel="Recentralizar"
            >
              {refreshingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconCrosshair size={20} color={colors.foreground} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.dateTime}>
              {formatNowFull(now.toISOString())}
            </ThemedText>
            <ThemedText style={[styles.precisao, { color: colors.mutedForeground }]}>
              {coords?.accuracy != null
                ? `${coords.accuracy.toFixed(2)} metros`
                : "—"}
            </ThemedText>
            <ThemedText style={[styles.endereco, { color: colors.mutedForeground }]}>
              {addressLoading ? "Buscando endereço…" : address || "Endereço não disponível"}
            </ThemedText>

            {locationError && (
              <View style={styles.warningRow}>
                <IconAlertTriangle size={16} color="#b91c1c" />
                <ThemedText style={[styles.warningText, { color: "#b91c1c" }]}>
                  {locationError}
                </ThemedText>
              </View>
            )}

            {foraDoPerimetro && perimeterInfo && (
              <View style={styles.warningRow}>
                <IconAlertTriangle size={16} color="#b45309" />
                <ThemedText style={[styles.warningText, { color: "#b45309" }]}>
                  Fora do perímetro permitido pela empresa.
                  {"  "}
                  <ThemedText style={[styles.warningText, { color: "#b45309", fontWeight: "400" }]}>
                    ({formatDistance(perimeterInfo.distanceMeters)} do perímetro)
                  </ThemedText>
                </ThemedText>
              </View>
            )}

            {config?.funcionarioAfastado && (
              <View style={styles.warningRow}>
                <IconAlertTriangle size={16} color="#b91c1c" />
                <ThemedText style={[styles.warningText, { color: "#b91c1c" }]}>
                  Você está em afastamento. Não é possível incluir ponto.
                </ThemedText>
              </View>
            )}

            {configLoadFailed && (
              <View style={styles.warningRow}>
                <IconAlertTriangle size={16} color="#b91c1c" />
                <ThemedText style={[styles.warningText, { color: "#b91c1c" }]}>
                  {configErrorMessage}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Photo preview (only when one was captured) */}
          {photoUri && (
            <View style={styles.photoRow}>
              <Image source={{ uri: photoUri }} style={styles.photoThumb} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: "600" }}>Foto pronta</ThemedText>
                <ThemedText
                  style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}
                >
                  Pronta para envio.
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setPhotoUri(null);
                  setPhotoBase64(null);
                }}
                style={[styles.smallBtn, { borderColor: colors.border }]}
              >
                <IconRefresh size={16} color={colors.foreground} />
                <ThemedText style={styles.smallBtnText}>Refazer</ThemedText>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>

      {/* Standard form footer — Cancelar + dynamic primary action. When a
          photo is required and missing, the primary action opens the camera
          ("Tirar Foto"). Once a photo is captured (or none is required),
          it switches to "Incluir Ponto" which fires the mutation. Same
          FormActionBar component used everywhere else in the app. */}
      {config?.exigirCapturaFotoPonto && !photoBase64 ? (
        <FormActionBar
          onCancel={() => nav.goBack()}
          onSubmit={handleCapturePhoto}
          canSubmit={!photoButtonDisabled}
          submitLabel="Tirar Foto"
          submittingLabel="Tirar Foto"
        />
      ) : (
        <FormActionBar
          onCancel={() => nav.goBack()}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          canSubmit={!submitDisabled}
          submitLabel="Incluir Ponto"
          submittingLabel="Enviando..."
        />
      )}

      {/* Selfie camera modal */}
      <SelfieCameraModal
        visible={cameraVisible}
        cameraType={(() => {
          // tipoCameraCapturaFotoPonto: 0=any, 1=front, 2=back
          if (config?.tipoCameraCapturaFotoPonto === 2) return "back";
          return "front";
        })()}
        allowFlip={config?.tipoCameraCapturaFotoPonto === 0}
        onCapture={handleCameraCaptured}
        onClose={() => setCameraVisible(false)}
      />
    </ThemedView>
  );
}

// ============================================================================
// Selfie camera — focused single-shot UI for the Inclusão de Ponto flow.
// Avoids overloading the generic FullCamera component (multi-photo / zoom
// presets aren't needed here, and the screenshots show a much simpler UX:
// flip / capture / cancel).
// ============================================================================

interface SelfieCameraModalProps {
  visible: boolean;
  cameraType: CameraType;
  allowFlip: boolean;
  onCapture: (uri: string, base64: string | null) => void;
  onClose: () => void;
}

function SelfieCameraModal({
  visible,
  cameraType,
  allowFlip,
  onCapture,
  onClose,
}: SelfieCameraModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>(cameraType);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    setFacing(cameraType);
  }, [cameraType]);

  useEffect(() => {
    if (visible && permission && !permission.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || taking) return;
    setTaking(true);
    try {
      // base64:true makes the camera return the encoded payload inline, so we
      // don't need a follow-up FileSystem.readAsStringAsync — that step was
      // unreliable on iOS (HEIC intermediates / disappearing tmp URIs) and was
      // the source of the user-visible "Falha ao processar a foto" error.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: false,
      });
      if (photo?.uri) onCapture(photo.uri, photo.base64 ?? null);
    } catch {
      Alert.alert("Erro", "Falha ao capturar a foto.");
    } finally {
      setTaking(false);
    }
  }, [taking, onCapture]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={selfieStyles.root}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
          />
        ) : (
          <View style={selfieStyles.permissionCenter}>
            <ThemedText style={{ color: "#fff", textAlign: "center" }}>
              Permissão de câmera necessária para tirar a foto.
            </ThemedText>
            <TouchableOpacity
              onPress={requestPermission}
              style={selfieStyles.permissionBtn}
            >
              <ThemedText style={{ color: "#000", fontWeight: "600" }}>
                Conceder permissão
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            selfieStyles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 16) + 12 },
          ]}
        >
          {allowFlip ? (
            <TouchableOpacity
              onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
              style={selfieStyles.sideBtn}
              accessibilityLabel="Inverter câmera"
            >
              <IconRefresh size={26} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={selfieStyles.sideBtn} />
          )}

          <TouchableOpacity
            onPress={takePicture}
            disabled={taking || !permission?.granted}
            style={[
              selfieStyles.shutter,
              !permission?.granted || taking ? { opacity: 0.5 } : null,
            ]}
            accessibilityLabel="Tirar foto"
          >
            {taking ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={selfieStyles.shutterInner} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              cameraRef.current?.pausePreview?.();
              onClose();
            }}
            style={selfieStyles.sideBtn}
            accessibilityLabel="Cancelar"
          >
            <IconX size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View
          style={[selfieStyles.cancelStrip, { paddingTop: insets.top + 12 }]}
        >
          <TouchableOpacity onPress={onClose} style={selfieStyles.cancelBtn}>
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Cancelar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrap: { flex: 1, padding: 16 },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  mapWrap: {
    flex: 1,
    position: "relative",
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mapPlaceholderText: { fontSize: 13 },
  recenter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardBody: { padding: 16, gap: 6, alignItems: "center" },
  dateTime: { fontSize: 18, fontWeight: "600" },
  precisao: { fontSize: 15 },
  endereco: { fontSize: 13, textAlign: "center" },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  warningText: { fontSize: 13, fontWeight: "500", flex: 1 },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  photoThumb: { width: 48, height: 48, borderRadius: 8 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallBtnText: { fontSize: 12, fontWeight: "500" },
});

const selfieStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  permissionCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sideBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  cancelStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cancelBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
