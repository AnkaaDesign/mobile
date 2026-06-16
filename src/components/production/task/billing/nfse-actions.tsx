import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { useEmitNfse, useCancelNfse } from "@/hooks/useInvoice";
import { IconSend, IconX } from "@tabler/icons-react-native";
import type { NfseDocument } from "@/types/invoice";

const CANCEL_REASONS = [
  { code: 1, label: "Erro na emissão" },
  { code: 2, label: "Serviço não prestado" },
  { code: 4, label: "Duplicidade da nota" },
];

interface NfseActionsProps {
  invoiceId: string;
  nfseDocuments: NfseDocument[];
}

export function NfseActions({ invoiceId, nfseDocuments }: NfseActionsProps) {
  const { colors } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonCode, setCancelReasonCode] = useState(1);
  const [cancelSubstituteNumber, setCancelSubstituteNumber] = useState("");
  const emitNfse = useEmitNfse();
  const cancelNfse = useCancelNfse();

  // Substitute NF number is required by the prefeitura for Duplicidade (code 4)
  const substituteRequired = cancelReasonCode === 4;

  const authorizedNfse = nfseDocuments.find((doc) => doc.status === "AUTHORIZED");
  const pendingOrErrorNfse = nfseDocuments.find(
    (doc) => doc.status === "PENDING" || doc.status === "ERROR",
  );

  const canEmit = !!pendingOrErrorNfse || nfseDocuments.length === 0;
  const canCancel = !!authorizedNfse;

  const handleEmit = () => {
    Alert.alert(
      nfseDocuments.length > 0 ? "Reemitir NFS-e" : "Emitir NFS-e",
      "Deseja emitir a NFS-e para esta fatura?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            emitNfse.mutate(invoiceId);
          },
        },
      ],
    );
  };

  const resetCancelForm = () => {
    setCancelReason("");
    setCancelReasonCode(1);
    setCancelSubstituteNumber("");
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 15) {
      Alert.alert(
        "Erro",
        "Motivo do cancelamento e obrigatorio e deve ter no minimo 15 caracteres.",
      );
      return;
    }

    if (substituteRequired && !cancelSubstituteNumber.trim()) {
      Alert.alert(
        "Erro",
        "Informe o numero da nota fiscal substituta para cancelamento por duplicidade.",
      );
      return;
    }

    if (!authorizedNfse) return;

    cancelNfse.mutate(
      {
        invoiceId,
        nfseDocumentId: authorizedNfse.id,
        data: {
          reason: cancelReason,
          reasonCode: cancelReasonCode,
          substituteNfseNumber: cancelSubstituteNumber.trim()
            ? Number(cancelSubstituteNumber)
            : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          resetCancelForm();
        },
      },
    );
  };

  return (
    <>
      <View style={styles.container}>
        {canEmit && (
          <TouchableOpacity
            onPress={handleEmit}
            disabled={emitNfse.isPending}
            style={[
              styles.actionButton,
              { backgroundColor: colors.muted },
              emitNfse.isPending && styles.disabledButton,
            ]}
            activeOpacity={0.7}
          >
            <IconSend size={16} color={colors.foreground} />
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            style={[styles.actionButton, { backgroundColor: colors.muted }]}
            activeOpacity={0.7}
          >
            <IconX size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel NFS-e Modal with reason input */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <ThemedText style={[styles.modalTitle, { color: colors.foreground }]}>
              Cancelar NFS-e
            </ThemedText>
            <ThemedText style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              Informe o motivo do cancelamento da NFS-e. Esta acao nao pode ser desfeita.
            </ThemedText>

            {/* Reason code selector */}
            <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
              Motivo
            </ThemedText>
            <View style={styles.reasonOptions}>
              {CANCEL_REASONS.map((r) => {
                const selected = cancelReasonCode === r.code;
                return (
                  <TouchableOpacity
                    key={r.code}
                    onPress={() => setCancelReasonCode(r.code)}
                    activeOpacity={0.7}
                    style={[
                      styles.reasonOption,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.reasonOptionText,
                        { color: selected ? "#fff" : colors.foreground },
                      ]}
                    >
                      {r.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
              Justificativa
            </ThemedText>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Descreva o motivo do cancelamento..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.reasonInput,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
            />

            {/* Substitute NFS-e number — required for Duplicidade (code 4) */}
            <ThemedText
              style={[
                styles.fieldLabel,
                { color: substituteRequired ? colors.destructive : colors.foreground },
              ]}
            >
              {`Nota fiscal substituta (No)${substituteRequired ? " *" : ""}`}
            </ThemedText>
            <TextInput
              value={cancelSubstituteNumber}
              onChangeText={setCancelSubstituteNumber}
              placeholder="Numero da NFS-e que substitui esta nota"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              style={[
                styles.reasonInput,
                styles.substituteInput,
                {
                  color: colors.foreground,
                  borderColor: substituteRequired ? colors.destructive : colors.border,
                  backgroundColor: colors.muted,
                },
              ]}
            />
            {substituteRequired && (
              <ThemedText style={[styles.helperText, { color: colors.destructive }]}>
                Obrigatorio para cancelamento por duplicidade.
              </ThemedText>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  resetCancelForm();
                }}
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.foreground }]}>
                  Voltar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelSubmit}
                disabled={cancelNfse.isPending}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.destructive },
                  cancelNfse.isPending && styles.disabledButton,
                ]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.modalButtonText, { color: "#fff" }]}>
                  {cancelNfse.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  modalDescription: {
    fontSize: fontSize.sm,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.sm,
    minHeight: 80,
    textAlignVertical: "top",
  },
  substituteInput: {
    minHeight: 0,
    textAlignVertical: "center",
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  reasonOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  reasonOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  reasonOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  helperText: {
    fontSize: fontSize.xs,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  modalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
