import { useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Modal } from "@/components/ui/modal";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";
import type { BatchOperationResult } from "@/types/common";
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react-native";
import { TABLET_WIDTH_THRESHOLD } from "@/lib/table-utils";

export interface StockBalanceBatchResult {
  itemName?: string;
  quantity?: number;
  operation?: string;
  [key: string]: any;
}

interface StockBalanceBatchResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchOperationResult<StockBalanceBatchResult, StockBalanceBatchResult> | null;
  onConfirm: () => void;
}

export function StockBalanceBatchResultModal({
  open,
  onOpenChange,
  result,
  onConfirm,
}: StockBalanceBatchResultModalProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const isTablet = screenWidth >= TABLET_WIDTH_THRESHOLD;

  const handleClose = useCallback(() => {
    onOpenChange(false);
    onConfirm();
  }, [onOpenChange, onConfirm]);

  if (!result) return null;

  const hasSuccesses = result.totalSuccess > 0;
  const hasFailures = result.totalFailed > 0;

  // Determine header content
  let HeaderIcon = IconCheck;
  let headerColor = colors.success || "#22c55e";
  let headerTitle = "Balanco concluido";

  if (hasFailures && !hasSuccesses) {
    HeaderIcon = IconX;
    headerColor = colors.destructive;
    headerTitle = "Falha no balanco";
  } else if (hasSuccesses && hasFailures) {
    HeaderIcon = IconAlertCircle;
    headerColor = "#eab308"; // warning yellow
    headerTitle = "Balanco parcial";
  }

  return (
    <Modal
      visible={open}
      onClose={handleClose}
      title={headerTitle}
    >
      <View style={styles.container}>
        {/* Header Icon */}
        <View style={[styles.headerIcon, { backgroundColor: headerColor + "20" }]}>
          <HeaderIcon size={32} color={headerColor} />
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Processados
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.foreground }]}>
                  {result.totalProcessed}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Sucesso
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.success || "#22c55e" }]}>
                  {result.totalSuccess}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  Falha
                </ThemedText>
                <ThemedText style={[styles.summaryValue, { color: colors.destructive }]}>
                  {result.totalFailed}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Results List */}
        <ScrollView
          style={styles.resultsList}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Successes */}
          {result.success.length > 0 && (
            <View style={styles.resultsSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Ajustes realizados
              </ThemedText>
              {result.success.map((item, index) => {
                const itemData = item as any;
                const itemName = itemData.itemName || itemData.item?.name || itemData.data?.itemName || "Item desconhecido";
                const quantity = itemData.quantity || itemData.data?.quantity || 0;
                const operation = itemData.operation || itemData.data?.operation;
                const isInbound = operation === "INBOUND";

                return (
                  <View
                    key={index}
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: (colors.success || "#22c55e") + "10",
                        borderColor: (colors.success || "#22c55e") + "30",
                      }
                    ]}
                  >
                    <IconCheck size={16} color={colors.success || "#22c55e"} />
                    <View style={styles.resultItemContent}>
                      <ThemedText style={[styles.resultItemName, { color: colors.foreground }]} numberOfLines={1}>
                        {itemName}
                      </ThemedText>
                      <View style={styles.resultItemDetail}>
                        {isInbound ? (
                          <IconArrowUp size={12} color={colors.success || "#22c55e"} />
                        ) : (
                          <IconArrowDown size={12} color={colors.destructive} />
                        )}
                        <ThemedText style={[
                          styles.resultItemQuantity,
                          { color: isInbound ? (colors.success || "#22c55e") : colors.destructive }
                        ]}>
                          {isInbound ? `+${quantity}` : `-${quantity}`}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Failures */}
          {result.failed.length > 0 && (
            <View style={styles.resultsSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.foreground }]}>
                Falhas
              </ThemedText>
              {result.failed.map((error, index) => {
                const errorData = error as any;
                const item = error.data as StockBalanceBatchResult;
                const itemName = errorData.itemName || item?.itemName || errorData.data?.itemName || "Item desconhecido";

                return (
                  <View
                    key={index}
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: colors.destructive + "10",
                        borderColor: colors.destructive + "30",
                      }
                    ]}
                  >
                    <IconX size={16} color={colors.destructive} />
                    <View style={styles.resultItemContent}>
                      <ThemedText style={[styles.resultItemName, { color: colors.foreground }]} numberOfLines={1}>
                        {itemName}
                      </ThemedText>
                      <ThemedText style={[styles.resultItemError, { color: colors.destructive }]} numberOfLines={2}>
                        {error.error}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Close Button */}
        <View style={styles.footer}>
          <Button variant="default" onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Fechar</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: "80%",
  },
  headerIcon: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  summaryContainer: {
    marginBottom: spacing.md,
  },
  summaryCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: "700",
  },
  resultsList: {
    maxHeight: 300,
  },
  resultsContent: {
    paddingBottom: spacing.sm,
  },
  resultsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  resultItemContent: {
    flex: 1,
  },
  resultItemName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
  },
  resultItemDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  resultItemQuantity: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  resultItemError: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.md,
  },
  closeButton: {
    width: "100%",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default StockBalanceBatchResultModal;
