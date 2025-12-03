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

// Activity batch result item shape
export interface ActivityBatchResult {
  itemName?: string;
  userName?: string;
  quantity?: number;
  item?: { name?: string };
  user?: { name?: string };
  data?: {
    itemName?: string;
    userName?: string;
    quantity?: number;
  };
  [key: string]: unknown;
}

interface ActivityBatchResultModalProps
  extends Omit<
    BatchOperationResultModalProps<ActivityBatchResult, ActivityBatchResult>,
    "entityName" | "successItemDisplay" | "failedItemDisplay"
  > {}

/**
 * ActivityBatchResultModal Component
 *
 * Specialized batch result modal for activity/movement operations.
 * Displays detailed item, user, and quantity information.
 */
export function ActivityBatchResultModal(props: ActivityBatchResultModalProps) {
  const { colors } = useTheme();

  const successItemDisplay = (item: ActivityBatchResult) => {
    const itemData = item as ActivityBatchResult;
    const itemName = itemData.itemName || itemData.item?.name || itemData.data?.itemName || "Item desconhecido";
    const userName = itemData.userName || itemData.user?.name || itemData.data?.userName || "Usuario desconhecido";
    const quantity = itemData.quantity || itemData.data?.quantity || 0;

    return (
      <View style={styles.itemContent}>
        <ThemedText style={styles.itemName}>{itemName}</ThemedText>
        <ThemedText style={[styles.itemMeta, { color: colors.mutedForeground }]}>
          {userName} • Quantidade: {quantity}
        </ThemedText>
      </View>
    );
  };

  const failedItemDisplay = (error: BatchOperationError<ActivityBatchResult>) => {
    const errorData = error as unknown as ActivityBatchResult;
    const item = error.data as ActivityBatchResult;

    const itemName =
      errorData.itemName || item?.itemName || errorData.data?.itemName || item?.item?.name || "Item desconhecido";
    const userName =
      errorData.userName || item?.userName || errorData.data?.userName || item?.user?.name || "Usuario desconhecido";

    // Parse error message for better formatting
    let errorDisplay: React.ReactNode;
    if (error.error.includes("Estoque insuficiente") || error.error.includes("Quantidade insuficiente") || error.error.includes("insuficiente em estoque")) {
      // Parse stock error - try multiple patterns
      // Handle formats like: "Disponivel: 0, Necessario: 2" or "Disponivel 0" or "Disponivel: 0"
      const availableMatch = error.error.match(/[Dd]ispon[ií]vel:?\s*(-?\d+)/i);
      const requestedMatch = error.error.match(/[Nn]ecess[aá]ri[oa]:?\s*(-?\d+)/i) ||
                            error.error.match(/[Ss]olicitad[oa]:?\s*(-?\d+)/i);

      const available = availableMatch ? availableMatch[1] : null;
      const requested = requestedMatch ? requestedMatch[1] : null;

      errorDisplay = (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorTitle, { color: colors.destructive }]}>
            Estoque insuficiente
          </ThemedText>
          {available !== null && (
            <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
              Disponivel: {available}
            </ThemedText>
          )}
          {requested !== null && (
            <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
              Necessario: {requested}
            </ThemedText>
          )}
        </View>
      );
    } else if (error.error.includes("excederia o limite maximo")) {
      // Format max limit error
      const match = error.error.match(/Maximo: (\d+), Atual: (\d+), Tentando adicionar: (\d+)/);
      if (match) {
        errorDisplay = (
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorTitle, { color: colors.destructive }]}>Limite maximo excedido</ThemedText>
            <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
              • Limite maximo: {match[1]}
            </ThemedText>
            <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
              • Quantidade atual: {match[2]}
            </ThemedText>
            <ThemedText style={[styles.errorDetail, { color: colors.mutedForeground }]}>
              • Tentando adicionar: {match[3]}
            </ThemedText>
          </View>
        );
      } else {
        errorDisplay = (
          <ThemedText style={[styles.errorDefault, { color: colors.destructive }]}>{error.error}</ThemedText>
        );
      }
    } else {
      // Default error display with line breaks handling
      const errorParts = error.error.split(".").filter((part) => part.trim());
      errorDisplay = (
        <View style={styles.errorContainer}>
          {errorParts.map((part, idx) => (
            <ThemedText key={idx} style={[styles.errorDefault, { color: colors.destructive }]}>
              {part.trim()}
            </ThemedText>
          ))}
        </View>
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
      entityName="atividade"
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
  errorDefault: {
    fontSize: fontSize.sm,
  },
});
