import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius, fontSize, fontWeight } from "@/constants/design-system";
import { useRegenerateBoleto, useCancelBoleto, useMarkBoletoPaid } from "@/hooks/useInvoice";
import { getCurrentApiUrl, uploadSingleFile } from "@/api-client";
import { ThemedText } from "@/components/ui/themed-text";
import { StandardModal } from "@/components/ui/standard-modal";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import {
  IconFileDownload,
  IconCopy,
  IconQrcode,
  IconRefresh,
  IconX,
  IconCurrencyReal,
} from "@tabler/icons-react-native";
import type { BankSlip } from "@/types/invoice";

const PAYMENT_METHODS = [
  { key: "PIX", label: "PIX" },
  { key: "CASH", label: "Dinheiro" },
  { key: "TRANSFER", label: "Transferência" },
  { key: "OTHER", label: "Outro" },
];

const RECEIPT_ACCEPTED_TYPES = ["image/*", "application/pdf"];
const RECEIPT_MAX_FILES = 20;

interface BoletoActionsProps {
  installmentId: string;
  bankSlip: BankSlip | null | undefined;
  /** Installment status — gates mark-as-paid (ACTIVE|OVERDUE|PENDING). */
  installmentStatus?: string | null;
}

export function BoletoActions({ installmentId, bankSlip, installmentStatus }: BoletoActionsProps) {
  const { colors } = useTheme();
  const regenerateBoleto = useRegenerateBoleto();
  const cancelBoleto = useCancelBoleto();
  const markPaid = useMarkBoletoPaid();

  // Mark-paid modal state
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [receiptItems, setReceiptItems] = useState<FilePickerItem[]>([]);
  const [observations, setObservations] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const slipStatus = bankSlip?.status;
  const isActive = slipStatus === "ACTIVE" || slipStatus === "OVERDUE";
  const canRegenerate = slipStatus === "ERROR" || slipStatus === "REJECTED";
  const canCancel = slipStatus === "ACTIVE" || slipStatus === "OVERDUE";
  // Allow mark-as-paid whenever the installment is not already paid: ACTIVE, OVERDUE,
  // PENDING or CANCELLED. PENDING covers the no-bank-slip flow (PIX/transfer). CANCELLED
  // lets a cancelled installment be revived straight to PAID (boleto cancelled but the
  // customer paid by PIX/cash), with the receipt attached in this same modal.
  const canMarkPaid =
    installmentStatus === "ACTIVE" ||
    installmentStatus === "OVERDUE" ||
    installmentStatus === "PENDING" ||
    installmentStatus === "CANCELLED";

  const handleViewPdf = async () => {
    try {
      const apiUrl = getCurrentApiUrl();
      const pdfUrl = `${apiUrl}/invoices/${installmentId}/boleto/pdf`;
      await Linking.openURL(pdfUrl);
    } catch {
      Alert.alert("Erro", "Erro ao abrir PDF do boleto");
    }
  };

  const handleCopyBarcode = async () => {
    if (!bankSlip?.digitableLine) return;
    try {
      await Clipboard.setStringAsync(bankSlip.digitableLine);
      Alert.alert("Sucesso", "Linha digitavel copiada");
    } catch {
      Alert.alert("Erro", "Erro ao copiar linha digitavel");
    }
  };

  const handleCopyPix = async () => {
    if (!bankSlip?.pixQrCode) return;
    try {
      await Clipboard.setStringAsync(bankSlip.pixQrCode);
      Alert.alert("Sucesso", "Codigo PIX copiado");
    } catch {
      Alert.alert("Erro", "Erro ao copiar codigo PIX");
    }
  };

  const handleRegenerate = () => {
    Alert.alert(
      "Regenerar Boleto",
      "Deseja regenerar este boleto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            regenerateBoleto.mutate({ installmentId });
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Boleto",
      "Tem certeza que deseja cancelar este boleto? Esta acao nao pode ser desfeita.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Confirmar Cancelamento",
          style: "destructive",
          onPress: () => {
            cancelBoleto.mutate({ installmentId });
          },
        },
      ],
    );
  };

  const resetMarkPaidState = () => {
    setPaymentMethod("");
    setReceiptItems([]);
    setObservations("");
  };

  const closeMarkPaidModal = () => {
    setShowMarkPaidModal(false);
    resetMarkPaidState();
  };

  /** Upload picked receipt files and return their file IDs. */
  const uploadReceipts = async (): Promise<string[]> => {
    const toUpload = receiptItems.filter((f) => !f.uploaded && !f.id);
    const ids: string[] = [];
    for (const item of toUpload) {
      const response = await fetch(item.uri);
      const blob = await response.blob();
      const file = new File([blob], item.name, {
        type: item.type || item.mimeType || "application/octet-stream",
      });
      const result = await uploadSingleFile(file, {
        fileContext: "receipt",
        entityType: "installment",
        entityId: installmentId,
      });
      const uploadedId = result.data?.id ?? result.id;
      if (result.success && uploadedId) {
        ids.push(uploadedId);
      } else {
        throw new Error(`Falha ao enviar ${item.name}`);
      }
    }
    // Include any previously-uploaded receipts the user kept.
    const keptIds = receiptItems
      .filter((f) => (f.uploaded || f.id) && f.id)
      .map((f) => f.id as string);
    return [...keptIds, ...ids];
  };

  const handleConfirmMarkPaid = async () => {
    if (!paymentMethod) {
      Alert.alert("Atencao", "Selecione o metodo de pagamento.");
      return;
    }
    setIsUploading(true);
    try {
      const receiptFileIds = receiptItems.length > 0 ? await uploadReceipts() : [];
      const trimmedObservations = observations.trim();
      markPaid.mutate(
        {
          installmentId,
          paymentMethod,
          receiptFileIds: receiptFileIds.length > 0 ? receiptFileIds : undefined,
          observations: trimmedObservations ? trimmedObservations : undefined,
        },
        {
          onSuccess: () => {
            closeMarkPaidModal();
          },
        },
      );
    } catch {
      Alert.alert("Erro", "Erro ao enviar os comprovantes");
    } finally {
      setIsUploading(false);
    }
  };

  // No actions to show at all → render nothing (e.g. PAID/CANCELLED with no slip).
  const hasAnyAction =
    isActive || canRegenerate || canCancel || canMarkPaid;
  if (!hasAnyAction) return null;

  const isProcessing = markPaid.isPending || isUploading;

  return (
    <View style={styles.container}>
      {(bankSlip?.pdfFileId || bankSlip?.digitableLine) && isActive && (
        <TouchableOpacity
          onPress={handleViewPdf}
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <IconFileDownload size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {bankSlip?.digitableLine && isActive && (
        <TouchableOpacity
          onPress={handleCopyBarcode}
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <IconCopy size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {bankSlip?.pixQrCode && isActive && (
        <TouchableOpacity
          onPress={handleCopyPix}
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <IconQrcode size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {canRegenerate && (
        <TouchableOpacity
          onPress={handleRegenerate}
          disabled={regenerateBoleto.isPending}
          style={[
            styles.actionButton,
            { backgroundColor: colors.muted },
            regenerateBoleto.isPending && styles.disabledButton,
          ]}
          activeOpacity={0.7}
        >
          <IconRefresh size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {canMarkPaid && (
        <TouchableOpacity
          onPress={() => setShowMarkPaidModal(true)}
          disabled={markPaid.isPending}
          style={[
            styles.actionButton,
            { backgroundColor: colors.muted },
            markPaid.isPending && styles.disabledButton,
          ]}
          activeOpacity={0.7}
        >
          <IconCurrencyReal size={16} color="#16a34a" />
        </TouchableOpacity>
      )}

      {canCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          disabled={cancelBoleto.isPending}
          style={[
            styles.actionButton,
            { backgroundColor: colors.muted },
            cancelBoleto.isPending && styles.disabledButton,
          ]}
          activeOpacity={0.7}
        >
          <IconX size={16} color={colors.destructive} />
        </TouchableOpacity>
      )}

      {/* Mark as Paid Modal — payment method + optional receipts + observations */}
      <StandardModal
        visible={showMarkPaidModal}
        onClose={closeMarkPaidModal}
        title="Marcar como Pago"
        subtitle="O boleto sera cancelado no banco e a parcela sera marcada como paga."
        icon={IconCurrencyReal}
        actions={[
          { label: "Cancelar", variant: "outline", onPress: closeMarkPaidModal, disabled: isProcessing },
          {
            label: isProcessing ? "Processando..." : "Confirmar Pagamento",
            onPress: handleConfirmMarkPaid,
            disabled: isProcessing || !paymentMethod,
            loading: isProcessing,
          },
        ]}
      >
        <View>
          {/* Payment method */}
          <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
            Metodo de Pagamento
          </ThemedText>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method.key;
              return (
                <TouchableOpacity
                  key={method.key}
                  onPress={() => setPaymentMethod(method.key)}
                  activeOpacity={0.7}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.muted,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.methodChipText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {method.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Receipts */}
          <View style={styles.fieldSpacing}>
            <FilePicker
              label="Comprovantes (opcional)"
              value={receiptItems}
              onChange={setReceiptItems}
              maxFiles={RECEIPT_MAX_FILES}
              acceptedFileTypes={RECEIPT_ACCEPTED_TYPES}
              showVideoCamera={false}
              placeholder="Adicionar comprovantes (PDF ou imagens)"
            />
          </View>

          {/* Observations */}
          <View style={styles.fieldSpacing}>
            <ThemedText style={[styles.fieldLabel, { color: colors.foreground }]}>
              Observacoes (opcional)
            </ThemedText>
            <Textarea
              value={observations}
              onChangeText={setObservations}
              placeholder="Detalhes adicionais sobre o pagamento..."
              numberOfLines={3}
            />
          </View>
        </View>
      </StandardModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
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
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  fieldSpacing: {
    marginTop: spacing.md,
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  methodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  methodChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
