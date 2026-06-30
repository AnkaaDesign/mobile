// cancel-reason-modal.tsx (mobile)
// Reusable "cancel with required reason" modal for the admission/termination
// status machines. The API hard-requires a non-empty trimmed `reason` when a
// process is cancelled (api termination/admission .service ~944), so the UI must
// collect it. Mirrors the web cancel dialog (required reason textarea).
//
// Standardized onto the canonical StandardModal (bonus-modal rules).

import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { IconAlertTriangle } from "@tabler/icons-react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { StandardModal } from "@/components/ui/standard-modal";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, borderRadius } from "@/constants/design-system";

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
    <StandardModal
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={description}
      icon={IconAlertTriangle}
      iconColor={colors.destructive}
      actions={[
        { label: "Voltar", variant: "outline", onPress: handleClose, disabled: loading },
        { label: confirmLabel, variant: "destructive", onPress: handleConfirm, disabled: !canSubmit, loading },
      ]}
    >
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
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    minHeight: 100,
    textAlignVertical: "top",
  },
  helper: { fontSize: fontSize.xs },
});
