import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import {
  BatchOperationResultModal,
  BatchOperationResultModalProps,
} from "@/components/common/batch-operation-result-modal";
import type { BatchOperationError } from "@/types/common";

// Borrow batch result item shape
export interface BorrowBatchResult {
  itemName?: string;
  userName?: string;
  quantity?: number;
  returnDate?: string;
  item?: { name?: string };
  user?: { name?: string };
  data?: {
    itemName?: string;
    userName?: string;
    quantity?: number;
    returnDate?: string;
  };
  [key: string]: unknown;
}

interface BorrowBatchResultModalProps
  extends Omit<
    BatchOperationResultModalProps<BorrowBatchResult, BorrowBatchResult>,
    "entityName" | "successItemDisplay" | "failedItemDisplay"
  > {}

/**
 * BorrowBatchResultModal Component
 *
 * Specialized batch result modal for borrow operations.
 * Displays detailed item and user information for each borrow.
 */
export function BorrowBatchResultModal(props: BorrowBatchResultModalProps) {
  const { colors } = useTheme();

  const successItemDisplay = (item: BorrowBatchResult) => {
    const itemData = item as BorrowBatchResult;
    const itemName = itemData.itemName || itemData.item?.name || itemData.data?.itemName || "Item desconhecido";
    const userName = itemData.userName || itemData.user?.name || itemData.data?.userName || "Usuario desconhecido";
    const quantity = itemData.quantity || itemData.data?.quantity || 0;
    const returnDate = itemData.returnDate || itemData.data?.returnDate;

    return (
      <View style={styles.itemContent}>
        <ThemedText style={styles.itemName}>{itemName}</ThemedText>
        <ThemedText style={[styles.itemMeta, { color: colors.mutedForeground }]}>{userName}</ThemedText>
        <ThemedText style={[styles.itemMeta, { color: colors.mutedForeground }]}>
          Quantidade: {quantity}
          {returnDate && (
            <ThemedText style={[styles.itemMeta, { color: colors.mutedForeground }]}>
              {" "}
              • Devolucao: {new Date(returnDate).toLocaleDateString("pt-BR")}
            </ThemedText>
          )}
        </ThemedText>
      </View>
    );
  };

  const failedItemDisplay = (error: BatchOperationError<BorrowBatchResult>) => {
    const errorData = error as unknown as BorrowBatchResult;
    const item = error.data as BorrowBatchResult;

    const itemName =
      item?.itemName || errorData.itemName || errorData.data?.itemName || item?.item?.name || "Item desconhecido";
    const userName =
      item?.userName || errorData.userName || errorData.data?.userName || item?.user?.name || "Usuario desconhecido";

    // Parse error message for better formatting
    let errorDisplay: React.ReactNode;
    if (error.error.includes("Estoque insuficiente")) {
      // Parse stock error
      const availableMatch = error.error.match(/[Dd]isponivel:?\s*(-?\d+)/);
      const requestedMatch =
        error.error.match(/[Ss]olicitad[oa]:?\s*(-?\d+)/) || error.error.match(/[Nn]ecessari[oa]:?\s*(-?\d+)/);

      const available = availableMatch?.[1] ?? "0";
      const requested = requestedMatch?.[1] ?? "0";

      errorDisplay = (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorTitle, { color: colors.destructive }]}>
            Quantidade insuficiente em estoque
          </ThemedText>
          <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
            Disponivel: {available}
          </ThemedText>
          <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
            Necessario: {requested}
          </ThemedText>
        </View>
      );
    } else if (error.error.includes("ja possui um emprestimo ativo")) {
      errorDisplay = (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorTitle, { color: colors.destructive }]}>Emprestimo duplicado</ThemedText>
          <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
            O usuario ja possui um emprestimo ativo deste item
          </ThemedText>
          <ThemedText style={[styles.errorHint, { color: colors.mutedForeground }]}>
            Devolva o emprestimo anterior antes de criar um novo
          </ThemedText>
        </View>
      );
    } else if (error.error.includes("emprestimos ativos. Limite maximo")) {
      const match = error.error.match(/ja possui (\d+) emprestimos ativos\. Limite maximo: (\d+)/);
      errorDisplay = (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorTitle, { color: colors.destructive }]}>
            Limite de emprestimos excedido
          </ThemedText>
          {match && (
            <>
              <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
                • Emprestimos ativos: {match[1]}
              </ThemedText>
              <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
                • Limite maximo: {match[2]}
              </ThemedText>
            </>
          )}
        </View>
      );
    } else {
      // Default error display
      errorDisplay = (
        <ThemedText style={[styles.errorDefault, { color: colors.destructive }]}>{error.error}</ThemedText>
      );
    }

    return (
      <View style={styles.itemContent}>
        <ThemedText style={styles.itemName}>{itemName}</ThemedText>
        <ThemedText style={[styles.itemMeta, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
          {userName}
        </ThemedText>
        {errorDisplay}
      </View>
    );
  };

  return (
    <BatchOperationResultModal
      {...props}
      entityName="emprestimo"
      successItemDisplay={successItemDisplay}
      failedItemDisplay={failedItemDisplay}
    />
  );
}

const styles = StyleSheet.create({
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  errorContainer: {
    gap: 4,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  errorDetail: {
    fontSize: fontSize.sm,
  },
  errorHint: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  errorDefault: {
    fontSize: fontSize.sm,
  },
});
