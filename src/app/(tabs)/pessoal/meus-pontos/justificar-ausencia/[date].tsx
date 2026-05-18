import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  findNodeHandle,
  UIManager,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import {
  IconCamera,
  IconCalendar,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react-native";
import { ThemedView, ThemedText, Combobox, Textarea } from "@/components/ui";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import {
  useMyJustificativas,
  useMyExistingSolicitacao,
  useCreateMyJustifyAbsence,
} from "@/hooks/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useTutorialTarget, TUTORIAL_TARGETS } from "@/components/tutorial";
import { isTutorialRuntimeActive } from "@/components/tutorial/tutorial-runtime-state";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB base64 length cap

const weekdayPt = (d: Date): string => {
  const names = [
    "Domingo",
    "Segunda-Feira",
    "Terça-Feira",
    "Quarta-Feira",
    "Quinta-Feira",
    "Sexta-Feira",
    "Sábado",
  ];
  return names[d.getDay()];
};

const formatYmd = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateLabel = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${weekdayPt(d)}, ${dd}/${mm}/${yyyy}`;
};

const formatRangeLabel = (a: Date, b: Date): string => {
  const fmt = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  return `${fmt(a)} → ${fmt(b)}`;
};

const dateFromYmd = (ymd: string): Date => {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// "Ausência em" — top-level selector between a single date and a multi-day
// period. Native Secullum exposes the same two options.
type AusenciaEm = "specific" | "period";
const AUSENCIA_EM_OPTIONS = [
  { value: "specific" as const, label: "Dia Específico" },
  { value: "period" as const, label: "Período de Afastamento" },
];

// tipoAusencia values match Secullum's POST /Solicitacoes payload. 0 = full
// day, 1/2/3 = period 1/2/3 of a single day, 4 = "Período Específico" (custom
// start/end time within a day). Only meaningful in Dia Específico mode.
type Periodo = 0 | 1 | 2 | 3 | 4;
const PERIODO_OPTIONS = [
  { value: "0", label: "Dia Inteiro" },
  { value: "1", label: "Período 1" },
  { value: "2", label: "Período 2" },
  { value: "3", label: "Período 3" },
  { value: "4", label: "Período Específico" },
];

export default function JustificarAusenciaFormScreen() {
  const { colors, isDark } = useTheme();
  const nav = useNav();
  const { date: dateParam, end: endParam } = useLocalSearchParams<{
    date: string;
    end?: string;
  }>();

  // If the route was opened with `?end=...`, the user came from a grouped
  // "Período de Afastamento" row — start in period mode with that range
  // pre-seeded. Otherwise default to single-day specific mode.
  const initialMode: AusenciaEm = typeof endParam === "string" && endParam ? "period" : "specific";

  const [ausenciaEm, setAusenciaEm] = useState<AusenciaEm>(initialMode);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateFromYmd(dateParam);
    }
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [periodStart, setPeriodStart] = useState<Date>(() => {
    if (typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateFromYmd(dateParam);
    }
    return new Date();
  });
  const [periodEnd, setPeriodEnd] = useState<Date>(() => {
    if (typeof endParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endParam)) {
      return dateFromYmd(endParam);
    }
    if (typeof dateParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateFromYmd(dateParam);
    }
    return new Date();
  });

  type PickerTarget = "single" | "periodStart" | "periodEnd" | null;
  const [datePickerTarget, setDatePickerTarget] = useState<PickerTarget>(null);
  const [datePickerTemp, setDatePickerTemp] = useState<Date>(new Date());

  const [periodo, setPeriodo] = useState<Periodo>(0);
  const [justificativaId, setJustificativaId] = useState<string | undefined>();
  const [observacoes, setObservacoes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // For pre-existing-check lookups, the date that matters is the start of
  // the range (in period mode) or the selected date (in specific mode).
  const referenceDate = ausenciaEm === "period" ? periodStart : selectedDate;
  const referenceDateYmd = useMemo(() => formatYmd(referenceDate), [referenceDate]);

  const justQuery = useMyJustificativas();
  const existingQuery = useMyExistingSolicitacao(referenceDateYmd);
  const createMutation = useCreateMyJustifyAbsence();

  const tutorialActive = isTutorialRuntimeActive();
  useScreenReady(
    tutorialActive || !(justQuery.isLoading || existingQuery.isLoading),
  );

  const formTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyForm);
  const ausenciaEmTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyAusenciaEm);
  const dataTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyData);
  const periodoAusenciaTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyPeriodoAusencia);
  const motivoTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyMotivo);
  const observacaoTarget = useTutorialTarget(TUTORIAL_TARGETS.pessoalPontosJustifyObservacao);
  const submitTarget = useTutorialTarget(
    TUTORIAL_TARGETS.pessoalPontosJustifySubmit,
    {
      onAction: () => {
        if (!tutorialActive) return;
        Alert.alert(
          "Solicitação enviada",
          "Sua solicitação de justificativa foi enviada para aprovação. (Tutorial: nenhuma alteração real foi feita.)",
        );
      },
    },
  );

  // ScrollView ref + Motivo measurement → scroll Motivo into view when the
  // combobox opens. Otherwise long forms hide the dropdown off-screen.
  const scrollViewRef = useRef<ScrollView>(null);
  const motivoRowRef = useRef<View>(null);
  const onMotivoOpen = useCallback(() => {
    const scroll = scrollViewRef.current as any;
    const node = motivoRowRef.current;
    if (!scroll || !node) return false;
    const handle = findNodeHandle(node);
    const innerScrollNode = scroll.getInnerViewNode?.() ?? findNodeHandle(scroll);
    if (handle == null || innerScrollNode == null) return false;
    UIManager.measureLayout(
      handle,
      innerScrollNode,
      () => undefined,
      (_x, y) => {
        scroll.scrollTo({ x: 0, y: Math.max(0, y - 24), animated: true });
      },
    );
    return true;
  }, []);

  const justificativas = justQuery.data?.data?.data ?? [];
  const justOptions = useMemo(
    () =>
      justificativas.map((j) => {
        const name = j.nomeCompleto.trim();
        return {
          value: String(j.id),
          label: name,
          // "Atestado em foto" was misleading — the doc could be a Declaração,
          // Laudo, etc. Mirror the chosen justificativa name in the hint so
          // the user knows exactly which document they need to photograph.
          description: j.exigirFotoAtestado
            ? `Foto ${name.toLowerCase()} obrigatória`
            : undefined,
        };
      }),
    [justificativas],
  );
  const selectedJust = useMemo(
    () => justificativas.find((j) => String(j.id) === justificativaId),
    [justificativas, justificativaId],
  );
  const photoRequired = !!selectedJust?.exigirFotoAtestado;

  const existing = existingQuery.data?.data?.data ?? null;
  const isExisting = !!existing && existing.justificativaId !== null;

  // Reset form when the reference date changes so the existing-solicitação
  // banner re-evaluates and stale per-date state is cleared.
  useEffect(() => {
    setJustificativaId(undefined);
    setObservacoes("");
    setPhotoUri(null);
    setPhotoBase64(null);
    setPeriodo(0);
  }, [referenceDateYmd]);

  // When the user switches to/from period mode, mirror the relevant date so
  // both selectors stay sensible.
  useEffect(() => {
    if (ausenciaEm === "period") {
      setPeriodStart(selectedDate);
      setPeriodEnd((cur) => (cur < selectedDate ? selectedDate : cur));
    } else {
      setSelectedDate(periodStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ausenciaEm]);

  const openDatePicker = (target: Exclude<PickerTarget, null>) => {
    const seed =
      target === "single"
        ? selectedDate
        : target === "periodStart"
          ? periodStart
          : periodEnd;
    setDatePickerTemp(seed);
    setDatePickerTarget(target);
  };

  const commitDatePicker = (value: Date) => {
    if (!datePickerTarget) return;
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    if (datePickerTarget === "single") {
      setSelectedDate(next);
    } else if (datePickerTarget === "periodStart") {
      setPeriodStart(next);
      // Keep end >= start.
      if (periodEnd < next) setPeriodEnd(next);
    } else {
      // End must be >= start.
      setPeriodEnd(next < periodStart ? periodStart : next);
    }
    setDatePickerTarget(null);
  };

  const pickPhoto = async (source: "camera" | "library") => {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permissão necessária",
        source === "camera"
          ? "Precisamos de acesso à câmera para tirar uma foto do documento."
          : "Precisamos de acesso à galeria para selecionar uma foto.",
      );
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
      base64: source === "camera",
    };
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;
    try {
      const base64String =
        asset.base64 ??
        (await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        }));
      if (base64String.length > MAX_PHOTO_BYTES) {
        Alert.alert(
          "Foto muito grande",
          "A imagem selecionada é muito grande. Por favor, escolha uma com menor resolução.",
        );
        return;
      }
      setPhotoUri(asset.uri);
      setPhotoBase64(base64String);
    } catch {
      Alert.alert("Erro", "Falha ao ler a foto. Tente novamente.");
    }
  };

  const handlePickPhoto = () => {
    Alert.alert("Adicionar foto", "Como deseja adicionar?", [
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
      const name = (selectedJust?.nomeCompleto ?? '').trim();
      Alert.alert(
        "Foto obrigatória",
        `Foto ${name.toLowerCase()} é obrigatória para enviar a justificativa.`,
      );
      return;
    }
    if (ausenciaEm === "period" && periodEnd < periodStart) {
      Alert.alert("Atenção", "A data final do período deve ser igual ou posterior à inicial.");
      return;
    }

    try {
      const payload =
        ausenciaEm === "period"
          ? {
              // Período de Afastamento — Secullum's payload populates
              // dataInicioAfastamento/dataFimAfastamento. The single `data`
              // field still gets the start date as the anchor (consistent
              // with how the GET response is shaped when no period is set).
              date: formatYmd(periodStart),
              dataInicioAfastamento: formatYmd(periodStart),
              dataFimAfastamento: formatYmd(periodEnd),
              tipoAusencia: 0 as 0 | 1 | 2 | 3 | 4,
              justificativaId: Number(justificativaId),
              observacoes: observacoes.trim() || undefined,
              photoBase64: photoBase64 ?? undefined,
            }
          : {
              date: formatYmd(selectedDate),
              tipoAusencia: periodo,
              justificativaId: Number(justificativaId),
              observacoes: observacoes.trim() || undefined,
              photoBase64: photoBase64 ?? undefined,
            };

      const res = await createMutation.mutateAsync(payload);

      const ok = res?.data?.success ?? false;
      if (ok) {
        Alert.alert("Solicitação enviada", "Sua solicitação foi enviada para aprovação.", [
          { text: "OK", onPress: () => nav.goBack() },
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

  const isLoading = justQuery.isLoading || existingQuery.isLoading;

  return (
    <>
      <Stack.Screen options={{ title: "Justificar Ausência" }} />
      <ThemedView
        ref={formTarget.ref as any}
        onLayout={formTarget.onLayout}
        collapsable={false}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          ref={scrollViewRef}
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

          {isExisting && ausenciaEm === "specific" && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <ThemedText style={{ color: colors.foreground, fontWeight: "600" }}>
                Já existe uma solicitação para esta data
              </ThemedText>
              <ThemedText style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 4 }}>
                Para enviar uma nova justificativa, selecione outra data acima.
              </ThemedText>
            </View>
          )}

          {/* Ausência em — top-level mode selector. */}
          <View
            ref={ausenciaEmTarget.ref as any}
            onLayout={ausenciaEmTarget.onLayout}
            collapsable={false}
            style={styles.field}
          >
            <ThemedText style={[styles.label, { color: colors.primary }]}>Ausência em</ThemedText>
            <Combobox
              options={AUSENCIA_EM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={ausenciaEm}
              onValueChange={(v) => {
                if (v === "specific" || v === "period") setAusenciaEm(v);
              }}
              clearable={false}
              searchable={false}
              disabled={createMutation.isPending}
            />
          </View>

          {ausenciaEm === "specific" ? (
            <>
              {/* Data — free selection */}
              <View
                ref={dataTarget.ref as any}
                onLayout={dataTarget.onLayout}
                collapsable={false}
                style={styles.field}
              >
                <ThemedText style={[styles.label, { color: colors.primary }]}>Data</ThemedText>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openDatePicker("single")}
                  disabled={createMutation.isPending}
                  style={[
                    styles.pickerBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    createMutation.isPending ? { opacity: 0.6 } : null,
                  ]}
                >
                  <ThemedText style={styles.pickerValue}>{formatDateLabel(selectedDate)}</ThemedText>
                  <IconCalendar size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Período da Ausência — combobox (Dia Inteiro / P1/P2/P3 /
                  Período Específico). Only shown in Dia Específico mode. */}
              <View
                ref={periodoAusenciaTarget.ref as any}
                onLayout={periodoAusenciaTarget.onLayout}
                collapsable={false}
                style={styles.field}
              >
                <ThemedText style={[styles.label, { color: colors.primary }]}>
                  Período da Ausência
                </ThemedText>
                <Combobox
                  options={PERIODO_OPTIONS}
                  value={String(periodo)}
                  onValueChange={(v) => {
                    if (typeof v === "string") setPeriodo(Number(v) as Periodo);
                  }}
                  clearable={false}
                  searchable={false}
                  disabled={isExisting || createMutation.isPending}
                />
              </View>
            </>
          ) : (
            // Período de Afastamento — two date pickers for start/end.
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: colors.primary }]}>
                Insira o Período
              </ThemedText>
              <View style={styles.rangeRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openDatePicker("periodStart")}
                  disabled={createMutation.isPending}
                  style={[
                    styles.pickerBox,
                    styles.rangeBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    createMutation.isPending ? { opacity: 0.6 } : null,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={[styles.rangeLabel, { color: colors.mutedForeground }]}
                    >
                      Início
                    </ThemedText>
                    <ThemedText style={styles.pickerValue}>
                      {formatRangeLabel(periodStart, periodStart).split(" → ")[0]}
                    </ThemedText>
                  </View>
                  <IconCalendar size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openDatePicker("periodEnd")}
                  disabled={createMutation.isPending}
                  style={[
                    styles.pickerBox,
                    styles.rangeBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    createMutation.isPending ? { opacity: 0.6 } : null,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      style={[styles.rangeLabel, { color: colors.mutedForeground }]}
                    >
                      Fim
                    </ThemedText>
                    <ThemedText style={styles.pickerValue}>
                      {formatRangeLabel(periodEnd, periodEnd).split(" → ")[0]}
                    </ThemedText>
                  </View>
                  <IconCalendar size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Motivo */}
          <View
            ref={(node) => {
              motivoRowRef.current = node;
              (motivoTarget.ref as any).current = node;
            }}
            onLayout={motivoTarget.onLayout}
            collapsable={false}
            style={styles.field}
          >
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
                disabled={(isExisting && ausenciaEm === "specific") || createMutation.isPending}
                onOpen={onMotivoOpen}
              />
            )}
          </View>

          {/* Foto (only when required) */}
          {photoRequired && (
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: colors.primary }]}>
                Foto {selectedJust?.nomeCompleto.trim().toLowerCase()}
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
                  disabled={(isExisting && ausenciaEm === "specific") || createMutation.isPending}
                  style={[
                    styles.photoButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  <IconCamera size={22} color={colors.primary} />
                  <ThemedText style={[styles.photoButtonText, { color: colors.primary }]}>
                    Adicionar foto
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Observação */}
          <View
            ref={observacaoTarget.ref as any}
            onLayout={observacaoTarget.onLayout}
            collapsable={false}
            style={styles.field}
          >
            <ThemedText style={[styles.label, { color: colors.primary }]}>Observação</ThemedText>
            <Textarea
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Detalhes adicionais (opcional)"
              numberOfLines={3}
              editable={!(isExisting && ausenciaEm === "specific") && !createMutation.isPending}
            />
          </View>
        </ScrollView>

        {/* Standard form footer — same component used across the app.
            FormActionBar handles safe-area inset internally; don't add
            extra paddingBottom or it floats too high above the home bar. */}
        <View
          ref={submitTarget.ref as any}
          onLayout={submitTarget.onLayout}
          collapsable={false}
        >
          <FormActionBar
            onCancel={() => nav.goBack()}
            onSubmit={handleSubmit}
            isSubmitting={createMutation.isPending}
            canSubmit={
              !((isExisting && ausenciaEm === "specific") || createMutation.isPending)
            }
            submitLabel="Enviar"
            submittingLabel="Enviando..."
          />
        </View>
      </ThemedView>

      {/* Date picker (modal on iOS, native dialog on Android) */}
      {datePickerTarget && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
              ]}
            >
              <DateTimePicker
                value={datePickerTemp}
                mode="date"
                display="spinner"
                themeVariant={isDark ? "dark" : "light"}
                maximumDate={new Date()}
                onChange={(_e, d) => {
                  if (d) setDatePickerTemp(d);
                }}
                style={styles.iosPicker}
              />
              <TouchableOpacity
                onPress={() => commitDatePicker(datePickerTemp)}
                style={styles.modalBtn}
              >
                <ThemedText style={[styles.modalBtnText, { color: colors.primary }]}>
                  Confirmar
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setDatePickerTarget(null)}
              style={[
                styles.modalSheet,
                styles.modalCancel,
                { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
              ]}
            >
              <ThemedText style={[styles.modalBtnText, { color: colors.primary }]}>
                Cancelar
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
      {datePickerTarget && Platform.OS === "android" && (
        <DateTimePicker
          value={datePickerTemp}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, d) => {
            if (event.type === "set" && d) {
              commitDatePicker(d);
            } else {
              setDatePickerTarget(null);
            }
          }}
        />
      )}
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
  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  pickerValue: { fontSize: 15, fontWeight: "600" },
  rangeRow: { flexDirection: "row", gap: 8 },
  rangeBox: { flex: 1, paddingVertical: 10 },
  rangeLabel: { fontSize: 11, marginBottom: 2 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
    padding: 8,
    gap: 8,
  },
  modalSheet: {
    borderRadius: 14,
    overflow: "hidden",
  },
  modalCancel: {
    paddingVertical: 18,
    alignItems: "center",
  },
  modalBtn: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(120,120,128,0.36)",
  },
  modalBtnText: { fontSize: 17, fontWeight: "600" },
  iosPicker: { alignSelf: "center" },
});
