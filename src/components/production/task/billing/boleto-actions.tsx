import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/lib/theme";
import { spacing, borderRadius } from "@/constants/design-system";
import { useRegenerateBoleto, useCancelBoleto, useMarkBoletoPaid } from "@/hooks/useInvoice";
import { getCurrentApiUrl } from "@/api-client";
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

interface BoletoActionsProps {
  installmentId: string;
  bankSlip: BankSlip | null | undefined;
}

export function BoletoActions({ installmentId, bankSlip }: BoletoActionsProps) {
  const { colors } = useTheme();
  const regenerateBoleto = useRegenerateBoleto();
  const cancelBoleto = useCancelBoleto();
  const markPaid = useMarkBoletoPaid();

  if (!bankSlip) return null;

  const isActive = bankSlip.status === "ACTIVE" || bankSlip.status === "OVERDUE";
  const canRegenerate = bankSlip.status === "ERROR" || bankSlip.status === "REJECTED";
  const canCancel = bankSlip.status === "ACTIVE" || bankSlip.status === "OVERDUE";
  const canMarkPaid = bankSlip.status === "ACTIVE" || bankSlip.status === "OVERDUE";

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
    if (!bankSlip.digitableLine) return;
    try {
      await Clipboard.setStringAsync(bankSlip.digitableLine);
      Alert.alert("Sucesso", "Linha digitavel copiada");
    } catch {
      Alert.alert("Erro", "Erro ao copiar linha digitavel");
    }
  };

  const handleCopyPix = async () => {
    if (!bankSlip.pixQrCode) return;
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
            regenerateBoleto.mutate(installmentId, {
              onSuccess: () => {
                Alert.alert("Sucesso", "Boleto regenerado com sucesso");
              },
              onError: () => {
                Alert.alert("Erro", "Erro ao regenerar boleto");
              },
            });
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
            cancelBoleto.mutate(
              { installmentId },
              {
                onSuccess: () => {
                  Alert.alert("Sucesso", "Boleto cancelado com sucesso");
                },
                onError: () => {
                  Alert.alert("Erro", "Erro ao cancelar boleto");
                },
              },
            );
          },
        },
      ],
    );
  };

  const handleMarkPaid = () => {
    // Show payment method selection
    Alert.alert(
      "Marcar como Pago",
      "O boleto sera cancelado no banco e a parcela sera marcada como paga.\n\nSelecione o metodo de pagamento:",
      [
        ...PAYMENT_METHODS.map((method) => ({
          text: method.label,
          onPress: () => {
            markPaid.mutate(
              { installmentId, paymentMethod: method.key },
              {
                onSuccess: () => {
                  Alert.alert("Sucesso", `Parcela marcada como paga via ${method.label}`);
                },
                onError: () => {
                  Alert.alert("Erro", "Erro ao marcar parcela como paga");
                },
              },
            );
          },
        })),
        { text: "Cancelar", style: "cancel" },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {(bankSlip.pdfFileId || bankSlip.digitableLine) && isActive && (
        <TouchableOpacity
          onPress={handleViewPdf}
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <IconFileDownload size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {bankSlip.digitableLine && isActive && (
        <TouchableOpacity
          onPress={handleCopyBarcode}
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
        >
          <IconCopy size={16} color={colors.foreground} />
        </TouchableOpacity>
      )}

      {bankSlip.pixQrCode && isActive && (
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
          onPress={handleMarkPaid}
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
});
