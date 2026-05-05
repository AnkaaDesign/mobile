import { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconCamera, IconInfoCircle, IconX } from "@tabler/icons-react-native";
import { ThemedView, ThemedText, Button, Combobox, Textarea } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import {
  useMyJustificativas,
  useMyExistingSolicitacao,
  useCreateMyJustifyAbsence,
} from "@/hooks/secullum";

const formatDayDisplay = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = [
    "Domingo",
    "Segunda-Feira",
    "Terça-Feira",
    "Quarta-Feira",
    "Quinta-Feira",
    "Sexta-Feira",
    "Sábado",
  ];
  return `${weekdays[date.getDay()]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
};

export default function JustificarAusenciaFormScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date: string }>();

  const [justificativaId, setJustificativaId] = useState<string | undefined>();
  const [observacoes, setObservacoes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const justQuery = useMyJustificativas();
  const existingQuery = useMyExistingSolicitacao(date as string);
  const createMutation = useCreateMyJustifyAbsence();

  const justificativas = justQuery.data?.data?.data ?? [];

  const justOptions = useMemo(
    () =>
      justificativas.map((j) => ({
        value: String(j.id),
        label: j.nomeCompleto.trim(),
        description: j.exigirFotoAtestado ? "Atestado em foto obrigatório" : undefined,
      })),
    [justificativas],
  );

  const selectedJust = useMemo(
    () => justificativas.find((j) => String(j.id) === justificativaId),
    [justificativas, justificativaId],
  );

  const photoRequired = !!selectedJust?.exigirFotoAtestado;

  // Existing solicitação (server-stored). When present, the form is read-only.
  const existing = existingQuery.data?.data?.data ?? null;
  const isExisting = !!existing && existing.justificativaId !== null;

  const pickPhoto = async (source: "camera" | "library") => {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert(
        "Permissão necessária",
        source === "camera"
          ? "Precisamos de acesso à câmera para tirar uma foto do atestado."
          : "Precisamos de acesso à galeria para selecionar uma foto.",
      );
      return;
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;

    // Read as base64 — Secullum expects raw base64 JPEG without the data: prefix.
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPhotoUri(asset.uri);
      setPhotoBase64(base64);
    } catch {
      Alert.alert("Erro", "Falha ao ler a foto. Tente novamente.");
    }
  };

  const handlePickPhoto = () => {
    Alert.alert("Adicionar foto", "Como deseja adicionar o atestado?", [
      { text: "Câmera", onPress: () => pickPhoto("camera") },
      { text: "Galeria", onPress: () => pickPhoto("library") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
  };

  const handleSubmit = async () => {
    if (!justificativaId) {
      Alert.alert("Atenção", "Selecione um motivo.");
      return;
    }
    if (photoRequired && !photoBase64) {
      Alert.alert(
        "Foto obrigatória",
        `O motivo "${selectedJust?.nomeCompleto.trim()}" exige um atestado em foto.`,
      );
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        date: date as string,
        justificativaId: Number(justificativaId),
        observacoes: observacoes.trim() || undefined,
        photoBase64: photoBase64 ?? undefined,
      });

      const ok = res?.data?.success ?? false;
      if (ok) {
        Alert.alert("Solicitação enviada", "Sua solicitação foi enviada para aprovação.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const message = res?.data?.message || "Falha ao enviar a solicitação.";
        Alert.alert("Erro", message);
      }
    } catch (err: any) {
      const apiData = err?.response?.data;
      const message =
        apiData?.message ||
        (Array.isArray(apiData?.validationErrors) && apiData.validationErrors[0]?.message) ||
        err?.message ||
        "Falha ao enviar a solicitação.";
      Alert.alert("Erro", message);
    }
  };

  if (!date) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText style={{ padding: 24 }}>Data inválida.</ThemedText>
      </ThemedView>
    );
  }

  const isLoading = justQuery.isLoading || existingQuery.isLoading;

  return (
    <>
      <Stack.Screen options={{ title: "Justificar Ausência" }} />
      <ThemedView
        style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconInfoCircle size={20} color={colors.primary} />
            <ThemedText style={[styles.infoText, { color: colors.primary }]}>
              A justificativa de ausência deve ser utilizada caso você fique ausente do trabalho por
              um dia ou período específico.
            </ThemedText>
          </View>

          {isExisting && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <ThemedText style={{ color: colors.foreground, fontWeight: "600" }}>
                Solicitação já existe
              </ThemedText>
              <ThemedText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                Já há uma solicitação para esta data aguardando aprovação.
              </ThemedText>
            </View>
          )}

          {/* Ausência em (locked) */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>Ausência em</ThemedText>
            <View
              style={[
                styles.readOnlyBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ThemedText style={styles.readOnlyText}>Dia Específico</ThemedText>
            </View>
          </View>

          {/* Data (read-only) */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>Data</ThemedText>
            <View
              style={[
                styles.readOnlyBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ThemedText style={styles.readOnlyText}>{formatDayDisplay(date)}</ThemedText>
            </View>
          </View>

          {/* Período (locked at Dia Inteiro for v1) */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>
              Período da Ausência
            </ThemedText>
            <View
              style={[
                styles.readOnlyBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <ThemedText style={styles.readOnlyText}>Dia Inteiro</ThemedText>
            </View>
          </View>

          {/* Motivo */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>Motivo</ThemedText>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
            ) : (
              <Combobox
                options={justOptions}
                value={justificativaId}
                onValueChange={(v) => setJustificativaId(typeof v === "string" ? v : undefined)}
                placeholder="Selecione o motivo"
                searchPlaceholder="Buscar motivo..."
                disabled={isExisting || createMutation.isPending}
              />
            )}
          </View>

          {/* Foto (only when required) */}
          {photoRequired && (
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: colors.primary }]}>
                Atestado (foto)
              </ThemedText>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    onPress={handleRemovePhoto}
                    style={[styles.photoRemoveBtn, { backgroundColor: colors.destructive }]}
                  >
                    <IconX size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickPhoto}
                  disabled={isExisting || createMutation.isPending}
                  style={[
                    styles.photoButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  <IconCamera size={22} color={colors.primary} />
                  <ThemedText style={[styles.photoButtonText, { color: colors.primary }]}>
                    Adicionar foto do atestado
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Observação */}
          <View style={styles.field}>
            <ThemedText style={[styles.label, { color: colors.primary }]}>Observação</ThemedText>
            <Textarea
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Detalhes adicionais (opcional)"
              numberOfLines={3}
              editable={!isExisting && !createMutation.isPending}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <Button
              variant="outline"
              onPress={() => router.back()}
              disabled={createMutation.isPending}
              style={styles.btn}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleSubmit}
              loading={createMutation.isPending}
              disabled={isExisting || createMutation.isPending}
              style={styles.btn}
            >
              Enviar
            </Button>
          </View>
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 4 },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  warningCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  readOnlyBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  readOnlyText: { fontSize: 15, fontWeight: "600" },
  photoButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  photoButtonText: { fontSize: 14, fontWeight: "600" },
  photoPreviewWrap: { position: "relative" },
  photoPreview: { width: "100%", height: 200, borderRadius: 10 },
  photoRemoveBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  btn: { flex: 1 },
});
