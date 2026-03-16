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

interface NfseActionsProps {
  invoiceId: string;
  nfseDocuments: NfseDocument[];
}

export function NfseActions({ invoiceId, nfseDocuments }: NfseActionsProps) {
  const { colors } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const emitNfse = useEmitNfse();
  const cancelNfse = useCancelNfse();

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
            emitNfse.mutate(invoiceId, {
              onSuccess: () => {
                Alert.alert("Sucesso", "NFS-e sera emitida em instantes");
              },
              onError: () => {
                Alert.alert("Erro", "Erro ao emitir NFS-e");
              },
            });
          },
        },
      ],
    );
  };

  const handleCancelSubmit = () => {
    if (!cancelReason.trim() || cancelReason.trim().length < 15) {
      Alert.alert(
        "Erro",
        "Motivo do cancelamento e obrigatorio e deve ter no minimo 15 caracteres.",
      );
      return;
    }

    if (!authorizedNfse) return;

    cancelNfse.mutate(
      { invoiceId, nfseDocumentId: authorizedNfse.id, data: { reason: cancelReason, reasonCode: 1 } },
      {
        onSuccess: () => {
          setShowCancelModal(false);
          setCancelReason("");
          Alert.alert("Sucesso", "NFS-e cancelada com sucesso");
        },
        onError: () => {
          Alert.alert("Erro", "Erro ao cancelar NFS-e");
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

            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Motivo do cancelamento..."
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

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
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
