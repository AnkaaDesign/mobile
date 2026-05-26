import { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  IconCalendar,
  IconClock,
  IconInfoCircle,
  IconX,
} from "@tabler/icons-react-native";
import { ThemedView, ThemedText, Textarea } from "@/components/ui";
import { FormActionBar } from "@/components/forms";
import { useTheme } from "@/lib/theme";
import { useNav } from "@/contexts/nav";
import {
  useCreateMyAjustePonto,
  useMyBatidasForDate,
  useMyExistingSolicitacao,
  useMyJustificativas,
} from "@/hooks/secullum";
import { useScreenReady } from "@/hooks/use-screen-ready";

type SlotKey =
  | "entrada1"
  | "saida1"
  | "entrada2"
  | "saida2"
  | "entrada3"
  | "saida3"
  | "entrada4"
  | "saida4"
  | "entrada5"
  | "saida5";

const SLOT_DEFINITIONS: ReadonlyArray<{ key: SlotKey; label: string }> = [
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
];

type Batidas = Record<SlotKey, string | null>;

const EMPTY_BATIDAS: Batidas = {
  entrada1: null,
  saida1: null,
  entrada2: null,
  saida2: null,
  entrada3: null,
  saida3: null,
  entrada4: null,
  saida4: null,
  entrada5: null,
  saida5: null,
};

const formatYmd = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

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

const formatDateLabel = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${weekdayPt(d)}, ${dd}/${mm}/${yyyy}`;
};

const hhmmFromDate = (d: Date): string => {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const dateFromHhmm = (hhmm: string | null): Date => {
  const base = new Date();
  base.setSeconds(0, 0);
  if (hhmm && /^\d{1,2}:\d{2}$/.test(hhmm)) {
    const [h, m] = hhmm.split(":").map(Number);
    base.setHours(h, m, 0, 0);
  }
  return base;
};

export default function AjustarPontoScreen() {
  const { colors, isDark } = useTheme();
  const nav = useNav();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [batidas, setBatidas] = useState<Batidas>(EMPTY_BATIDAS);
  const [observacoes, setObservacoes] = useState("");
  const [activePickerSlot, setActivePickerSlot] = useState<SlotKey | null>(null);
  const [pickerTemp, setPickerTemp] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTemp, setDatePickerTemp] = useState<Date>(new Date());

  const dateYmd = useMemo(() => formatYmd(selectedDate), [selectedDate]);

  const batidasQuery = useMyBatidasForDate(dateYmd);
  const existingQuery = useMyExistingSolicitacao(dateYmd);
  // Used to derive the 3-char abbreviation that fills the entrada/saida
  // slots when the date has a pending justificativa (Esqueceu → ESQ etc).
  // The /Solicitacoes response only carries justificativaId, so we join
  // with the full justificativa list to recover the name.
  const justificativasQuery = useMyJustificativas();
  const createMutation = useCreateMyAjustePonto();

  useScreenReady(
    !(batidasQuery.isLoading || existingQuery.isLoading),
  );

  // Pre-fill priority:
  //   1. Pending ajuste (tipo=0): show the user's own pending edits +
  //      observação as editable. Native Secullum behaves this way too.
  //   2. Pending justificativa (tipo=2/3, justificativaId set): show its
  //      observação read-only and leave entradas blank — the day is being
  //      justified so individual batidas don't apply, but the user still
  //      wants to see WHAT they wrote in the existing request.
  //   3. No pending request: pre-fill from canonical batidas.
  const existing = existingQuery.data?.data?.data ?? null;
  const isExisting = !!existing && existing.justificativaId !== null;

  const pendingAjuste = useMemo(() => {
    if (!existing) return null;
    if (existing.justificativaId != null) return null;
    if (existing.tipo !== 0) return null;
    const anyBatida =
      existing.entrada1 || existing.saida1 ||
      existing.entrada2 || existing.saida2 ||
      existing.entrada3 || existing.saida3 ||
      existing.entrada4 || existing.saida4 ||
      existing.entrada5 || existing.saida5 ||
      (existing.observacoes ?? '').trim();
    return anyBatida ? existing : null;
  }, [existing]);

  // Native Secullum fills every entrada/saida slot with a 3-char uppercase
  // abbreviation of the chosen justificativa (Esqueceu → ESQ, Atestado
  // Médico → ATE, Treinamento → TRE…) when the date is being justified.
  // It's a visual cue that the slot doesn't need a time.
  const justAbbreviation = useMemo<string | null>(() => {
    if (!isExisting || existing?.justificativaId == null) return null;
    const list = justificativasQuery.data?.data?.data ?? [];
    const just = list.find((j) => j.id === existing.justificativaId);
    if (!just) return null;
    return just.nomeCompleto
      .trim()
      .replace(/[^A-Za-zÀ-ÿ]/g, '')
      .slice(0, 3)
      .toUpperCase();
  }, [isExisting, existing, justificativasQuery.data]);

  useEffect(() => {
    if (pendingAjuste) {
      setBatidas({
        entrada1: pendingAjuste.entrada1 ?? null,
        saida1: pendingAjuste.saida1 ?? null,
        entrada2: pendingAjuste.entrada2 ?? null,
        saida2: pendingAjuste.saida2 ?? null,
        entrada3: pendingAjuste.entrada3 ?? null,
        saida3: pendingAjuste.saida3 ?? null,
        entrada4: pendingAjuste.entrada4 ?? null,
        saida4: pendingAjuste.saida4 ?? null,
        entrada5: pendingAjuste.entrada5 ?? null,
        saida5: pendingAjuste.saida5 ?? null,
      });
      setObservacoes(pendingAjuste.observacoes ?? '');
      return;
    }
    // Pending justificativa: fill every slot with the justificativa's
    // 3-char abbreviation (ESQ / ATE / TRE…) so the UI matches native
    // Secullum's "this slot is justified" visual. Surface the existing
    // observação read-only too.
    if (isExisting) {
      const abbr = justAbbreviation;
      if (abbr) {
        setBatidas({
          entrada1: abbr, saida1: abbr,
          entrada2: abbr, saida2: abbr,
          entrada3: abbr, saida3: abbr,
          entrada4: abbr, saida4: abbr,
          entrada5: abbr, saida5: abbr,
        });
      } else {
        setBatidas(EMPTY_BATIDAS);
      }
      setObservacoes(existing?.observacoes ?? '');
      return;
    }
    const apiData = batidasQuery.data?.data;
    if (!apiData || !("data" in apiData) || !apiData.data) return;
    const d = apiData.data;
    setBatidas({
      entrada1: d.entrada1,
      saida1: d.saida1,
      entrada2: d.entrada2,
      saida2: d.saida2,
      entrada3: d.entrada3,
      saida3: d.saida3,
      entrada4: d.entrada4,
      saida4: d.saida4,
      entrada5: d.entrada5,
      saida5: d.saida5,
    });
    setObservacoes('');
  }, [pendingAjuste, isExisting, existing, justAbbreviation, batidasQuery.data, dateYmd]);
  const periodoEncerrado =
    !!batidasQuery.data?.data?.data?.existePeriodoEncerrado;
  // Two distinct disabled states:
  //   • dateDisabled — only true while submitting. The user must always
  //     be able to navigate to other dates, even when an existing
  //     solicitação locks the current one.
  //   • editDisabled — the original "this form is read-only" flag.
  //     Drives the time-slot pickers, observação textarea, and submit btn.
  const dateDisabled = createMutation.isPending;
  const editDisabled =
    isExisting || periodoEncerrado || createMutation.isPending;
  // Back-compat alias: many call sites used `disabled` for editing.
  const disabled = editDisabled;

  const openTimePicker = (key: SlotKey) => {
    if (disabled) return;
    setPickerTemp(dateFromHhmm(batidas[key]));
    setActivePickerSlot(key);
  };

  const commitTimePicker = (value: Date) => {
    if (!activePickerSlot) return;
    setBatidas((prev) => ({ ...prev, [activePickerSlot]: hhmmFromDate(value) }));
    setActivePickerSlot(null);
  };

  const cancelTimePicker = () => setActivePickerSlot(null);

  const clearSlot = (key: SlotKey) => {
    if (disabled) return;
    setBatidas((prev) => ({ ...prev, [key]: null }));
  };

  const openDatePicker = () => {
    setDatePickerTemp(selectedDate);
    setShowDatePicker(true);
  };

  const commitDatePicker = (value: Date) => {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    setSelectedDate(next);
    setShowDatePicker(false);
  };

  const hasAnyBatida = SLOT_DEFINITIONS.some(
    (s) => (batidas[s.key] ?? "").length > 0,
  );

  const handleSubmit = async () => {
    if (!hasAnyBatida) {
      Alert.alert("Atenção", "Informe pelo menos uma batida para ajustar.");
      return;
    }

    if (!observacoes.trim()) {
      Alert.alert("Atenção", "Informe uma observação justificando o ajuste.");
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        date: dateYmd,
        entrada1: batidas.entrada1,
        saida1: batidas.saida1,
        entrada2: batidas.entrada2,
        saida2: batidas.saida2,
        entrada3: batidas.entrada3,
        saida3: batidas.saida3,
        entrada4: batidas.entrada4,
        saida4: batidas.saida4,
        entrada5: batidas.entrada5,
        saida5: batidas.saida5,
        observacoes: observacoes.trim() || undefined,
      });

      const ok = res?.data?.success ?? false;
      if (ok) {
        // API client interceptor already shows the success toast
        nav.goBack();
      } else {
        const message = res?.data?.message || "Falha ao enviar a solicitação.";
        Alert.alert("Erro", message);
      }
    } catch (err: any) {
      // API client interceptor already shows the error toast
    }
  };

  // Highest pair index that has at least one filled slot — used to decide
  // how many pairs to render. We always reveal one empty pair beyond the
  // last filled one so the user can extend the day without scrolling
  // through all five slots.
  const visiblePairCount = useMemo(() => {
    let lastFilled = 0;
    for (let i = 1; i <= 5; i++) {
      const e = batidas[`entrada${i}` as SlotKey];
      const s = batidas[`saida${i}` as SlotKey];
      if ((e ?? "") !== "" || (s ?? "") !== "") lastFilled = i;
    }
    return Math.min(5, Math.max(3, lastFilled + 1));
  }, [batidas]);

  const visibleSlots = SLOT_DEFINITIONS.slice(0, visiblePairCount * 2);

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <IconInfoCircle size={20} color={colors.primary} />
          <ThemedText style={[styles.infoText, { color: colors.primary }]}>
            O ajuste de ponto deve ser utilizado caso você tenha tido algum
            problema para registrar o ponto.
          </ThemedText>
        </View>

        {isExisting && (
          <View
            style={[
              styles.warningCard,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <ThemedText
              style={{ color: colors.foreground, fontWeight: "600" }}
            >
              Solicitação já existe
            </ThemedText>
            <ThemedText
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Já há uma solicitação para esta data aguardando aprovação.
            </ThemedText>
          </View>
        )}

        {periodoEncerrado && !isExisting && (
          <View
            style={[
              styles.warningCard,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <ThemedText
              style={{ color: colors.foreground, fontWeight: "600" }}
            >
              Período encerrado
            </ThemedText>
            <ThemedText
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              Esta data está em um período já encerrado e não aceita ajustes.
            </ThemedText>
          </View>
        )}

        {/* Data */}
        <View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openDatePicker}
            disabled={dateDisabled}
            style={[
              styles.field,
              { backgroundColor: colors.card, borderColor: colors.border },
              dateDisabled ? { opacity: 0.6 } : null,
            ]}
          >
            <View style={styles.fieldText}>
              <ThemedText style={[styles.fieldLabel, { color: colors.primary }]}>
                Data
              </ThemedText>
              <ThemedText style={styles.fieldValue}>
                {formatDateLabel(selectedDate)}
              </ThemedText>
            </View>
            <IconCalendar size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Batida slots */}
        {visibleSlots.map((slot) => {
          const value = batidas[slot.key];
          const filled = (value ?? "").length > 0;
          return (
            <View key={slot.key}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openTimePicker(slot.key)}
                disabled={disabled}
                style={[
                  styles.field,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  disabled ? { opacity: 0.6 } : null,
                ]}
              >
                <View style={styles.fieldText}>
                  <ThemedText
                    style={[styles.fieldLabel, { color: colors.primary }]}
                  >
                    {slot.label}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.fieldValue,
                      !filled ? { color: colors.mutedForeground } : null,
                    ]}
                  >
                    {filled ? value : "--:--"}
                  </ThemedText>
                </View>
                {filled ? (
                  <TouchableOpacity
                    onPress={() => clearSlot(slot.key)}
                    disabled={disabled}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.iconAction}
                  >
                    <IconX size={20} color={colors.foreground} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.iconAction}>
                    <IconClock size={22} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Observação */}
        <View style={styles.observationWrap}>
          <ThemedText style={[styles.fieldLabel, { color: colors.primary }]}>
            Observação
          </ThemedText>
          <Textarea
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Detalhes adicionais (opcional)"
            numberOfLines={3}
            editable={!disabled}
          />
        </View>
      </ScrollView>

      {/* Action bar — matches the standard form footer used across the app.
          FormActionBar already applies `marginBottom: insets.bottom +
          cardMarginBottom` internally, so DON'T add another paddingBottom
          here or the bar floats too high. */}
      <View>
        <FormActionBar
          onCancel={() => nav.goBack()}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          canSubmit={!disabled && hasAnyBatida}
          submitLabel="Enviar"
          submittingLabel="Enviando..."
        />
      </View>

      {/* Time picker — iOS spinner in a modal, Android native dialog. */}
      {activePickerSlot && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
              ]}
            >
              <DateTimePicker
                value={pickerTemp}
                mode="time"
                display="spinner"
                themeVariant={isDark ? "dark" : "light"}
                onChange={(_e, d) => {
                  if (d) setPickerTemp(d);
                }}
                style={styles.iosPicker}
              />
              <TouchableOpacity
                onPress={() => commitTimePicker(pickerTemp)}
                style={[styles.modalBtn, styles.modalBtnTop]}
              >
                <ThemedText
                  style={[styles.modalBtnText, { color: colors.primary }]}
                >
                  Confirm
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={cancelTimePicker}
              style={[
                styles.modalSheet,
                styles.modalCancel,
                { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
              ]}
            >
              <ThemedText
                style={[styles.modalBtnText, { color: colors.primary }]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
      {activePickerSlot && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerTemp}
          mode="time"
          display="default"
          onChange={(event, d) => {
            if (event.type === "set" && d) {
              commitTimePicker(d);
            } else {
              cancelTimePicker();
            }
          }}
        />
      )}

      {/* Date picker */}
      {showDatePicker && Platform.OS === "ios" && (
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
                style={[styles.modalBtn, styles.modalBtnTop]}
              >
                <ThemedText
                  style={[styles.modalBtnText, { color: colors.primary }]}
                >
                  Confirm
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={[
                styles.modalSheet,
                styles.modalCancel,
                { backgroundColor: isDark ? "#1c1c1e" : "#fff" },
              ]}
            >
              <ThemedText
                style={[styles.modalBtnText, { color: colors.primary }]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={datePickerTemp}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, d) => {
            if (event.type === "set" && d) {
              commitDatePicker(d);
            } else {
              setShowDatePicker(false);
            }
          }}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },
  warningCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 64,
    gap: 10,
  },
  fieldText: { flex: 1 },
  fieldLabel: { fontSize: 12, fontWeight: "500", marginBottom: 2 },
  fieldValue: { fontSize: 16, fontWeight: "600" },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  observationWrap: { gap: 4, marginTop: 4 },
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
  modalBtnTop: {},
  modalBtnText: { fontSize: 17, fontWeight: "600" },
  iosPicker: { alignSelf: "center" },
});
