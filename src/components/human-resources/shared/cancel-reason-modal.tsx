// cancel-reason-modal.tsx (mobile)
// Reusable "cancel with required reason" modal for the admission/termination
// status machines. The API hard-requires a non-empty trimmed `reason` when a
// process is cancelled (api termination/admission .service ~944), so the UI must
// collect it. Mirrors the web cancel dialog (required reason textarea).

import { useState } from "react";
import { View, StyleSheet, Modal, TextInput } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

interface CancelReasonModalProps {
  visible: boolean;
  title: string;
  description: string;
  /** Label for the destructive confirm button (e.g. "Cancelar Rescisão"). */
  confirmLabel: string;
  loading?: boolean;
  onClose: () => void;
  /** Receives the trimmed, non-empty reason. */
  onConfirm: (reason: string) => void;
}

export function CancelReasonModal({
  visible,
  title,
  description,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: CancelReasonModalProps) {
  const { colors } = useTheme();
  const [reason, setReason] = useState("");

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !loading;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <ThemedText style={[styles.title, { color: colors.foreground }]}>{title}</ThemedText>
          <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>{description}</ThemedText>

          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Motivo do cancelamento (obrigatório)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            autoFocus
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted },
            ]}
          />
          {trimmed.length === 0 && (
            <ThemedText style={[styles.helper, { color: colors.mutedForeground }]}>
              O motivo é obrigatório para cancelar.
            </ThemedText>
          )}

          <View style={styles.actions}>
            <Button variant="outline" onPress={handleClose} disabled={loading}>
              Voltar
            </Button>
            <Button variant="destructive" onPress={handleConfirm} disabled={!canSubmit} loading={loading}>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: { width: "100%", borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  description: { fontSize: fontSize.sm },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    minHeight: 100,
    textAlignVertical: "top",
  },
  helper: { fontSize: fontSize.xs },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
