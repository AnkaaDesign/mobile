import React, { useEffect, useState } from "react";
import { Modal, View, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { IconX, IconClock } from "@tabler/icons-react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <IconClock size={20} color={colors.primary} />
              <View>
                <ThemedText style={[styles.title, { color: colors.foreground }]}>Editar Registro</ThemedText>
                {!!subtitle && <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</ThemedText>}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <IconX size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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
          </ScrollView>

          {/* Footer actions */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <Button variant="outline" onPress={onClose} style={styles.footerBtn} disabled={updateMutation.isPending}>
              Cancelar
            </Button>
            <Button variant="default" onPress={handleSave} style={styles.footerBtn} loading={updateMutation.isPending}>
              Salvar
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  subtitle: { fontSize: fontSize.xs, marginTop: 1, textTransform: "capitalize" },
  closeBtn: { padding: 4 },
  body: { padding: spacing.lg, gap: spacing.md },
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
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
  footerBtn: { flex: 1 },
});
