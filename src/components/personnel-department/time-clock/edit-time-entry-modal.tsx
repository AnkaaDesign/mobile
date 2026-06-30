import { useEffect, useState } from "react";
import { View, TextInput, StyleSheet, Alert } from "react-native";
import { IconClock } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { StandardModal } from "@/components/ui/standard-modal";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useSecullumUpdateTimeEntryFull } from "@/hooks/secullum";

interface EditTimeEntryModalProps {
  visible: boolean;
  onClose: () => void;
  /** Raw Secullum Batidas row (Id, Data, Entrada1..Saida5, Versao, ...). */
  entry: Record<string, any> | null;
  /** Header subtitle, e.g. "Kennedy · 12/06 - quinta". */
  subtitle?: string;
  onSaved?: () => void;
}

/** The punch pairs we expose for editing (Secullum supports up to 5). */
const PAIRS = [
  { entry: "Entrada1", exit: "Saida1" },
  { entry: "Entrada2", exit: "Saida2" },
  { entry: "Entrada3", exit: "Saida3" },
] as const;

/** Light HH:MM mask — keeps digits, inserts the colon after the hour. */
function maskTime(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function EditTimeEntryModal({ visible, onClose, entry, subtitle, onSaved }: EditTimeEntryModalProps) {
  const { colors } = useTheme();
  const updateMutation = useSecullumUpdateTimeEntryFull();

  const [fields, setFields] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");

  // Seed local state whenever a new entry is opened.
  useEffect(() => {
    if (!entry) return;
    const seed: Record<string, string> = {};
    for (const { entry: e, exit: s } of PAIRS) {
      seed[e] = entry[e] || "";
      seed[s] = entry[s] || "";
    }
    setFields(seed);
    setReason("");
  }, [entry]);

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: maskTime(value) }));
  };

  const handleSave = async () => {
    if (!entry) return;

    // Detect whether anything actually changed.
    const changed = PAIRS.some(({ entry: e, exit: s }) => (fields[e] || "") !== (entry[e] || "") || (fields[s] || "") !== (entry[s] || ""));
    if (!changed) {
      onClose();
      return;
    }

    // Forward the whole original row with edited punch fields + the reason, so the
    // API keeps Versao/FonteDados and Secullum accepts the change.
    const payload: Record<string, any> = { ...entry, ...fields };
    if (reason.trim()) payload.Observacoes = reason.trim();

    try {
      await updateMutation.mutateAsync({ entryId: String(entry.Id ?? entry.id), payload });
      onSaved?.();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Não foi possível salvar o registro.";
      Alert.alert("Erro ao salvar", message);
    }
  };

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Editar Registro"
      subtitle={subtitle}
      icon={IconClock}
      actions={[
        { label: "Cancelar", variant: "outline", onPress: onClose, disabled: updateMutation.isPending },
        { label: "Salvar", onPress: handleSave, loading: updateMutation.isPending },
      ]}
    >
      {PAIRS.map(({ entry: e, exit: s }, idx) => (
        <View key={e} style={styles.pairRow}>
          <View style={styles.pairField}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{`Entrada ${idx + 1}`}</ThemedText>
            <TextInput
              value={fields[e] ?? ""}
              onChangeText={(v) => setField(e, v)}
              placeholder="--:--"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={5}
              style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
            />
          </View>
          <View style={styles.pairField}>
            <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{`Saída ${idx + 1}`}</ThemedText>
            <TextInput
              value={fields[s] ?? ""}
              onChangeText={(v) => setField(s, v)}
              placeholder="--:--"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={5}
              style={[styles.timeInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
            />
          </View>
        </View>
      ))}

      <View style={styles.reasonField}>
        <ThemedText style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Justificativa (opcional)</ThemedText>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo da alteração"
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[styles.reasonInput, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
        />
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  pairRow: { flexDirection: "row", gap: spacing.md },
  pairField: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  timeInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    letterSpacing: 1,
  },
  reasonField: { gap: 4, marginTop: spacing.xs },
  reasonInput: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    fontSize: fontSize.sm,
    textAlignVertical: "top",
  },
});
