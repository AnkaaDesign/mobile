import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  IconFileText,
  IconList,
  IconLayoutGrid,
  IconCurrencyReal,
  IconFileInvoice,
  IconReceipt
} from "@tabler/icons-react-native";
import { FileItem, useFileViewer, type FileViewMode } from "@/components/file";
import type { Order, File } from "@/types";

interface OrderDocumentsCardProps {
  order: Order;
}

export function OrderDocumentsCard({ order }: OrderDocumentsCardProps) {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<FileViewMode>("grid");
  const fileViewer = useFileViewer();

  const budgets = order.budgets || [];
  const invoices = order.invoices || [];
  const receipts = order.receipts || [];
  const reimbursements = order.reimbursements || [];
  const invoiceReimbursements = order.invoiceReimbursements || [];

  const allDocuments = [
    ...budgets,
    ...invoices,
    ...receipts,
    ...reimbursements,
    ...invoiceReimbursements,
  ];
  const hasDocuments = allDocuments.length > 0;

  const handleFilePress = (file: File) => {
    const index = allDocuments.findIndex((f) => f.id === file.id);
    fileViewer.actions.viewFiles(allDocuments, index);
  };

  const renderFileSection = (
    title: string,
    files: File[],
    icon: React.ReactNode,
    color: string
  ) => {
    if (files.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {icon}
          <ThemedText style={[styles.sectionTitle, { color }]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
            ({files.length})
          </ThemedText>
        </View>
        <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              baseUrl={process.env.EXPO_PUBLIC_API_URL}
              onPress={handleFilePress}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
            <IconFileText size={20} color={colors.primary} />
          </View>
          <ThemedText style={styles.cardTitle}>Documentos</ThemedText>
        </View>
        {hasDocuments && (
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                {
                  backgroundColor:
                    viewMode === "list" ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
            >
              <IconList
                size={16}
                color={
                  viewMode === "list"
                    ? colors.primaryForeground
                    : colors.foreground
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                {
                  backgroundColor:
                    viewMode === "grid" ? colors.primary : colors.muted,
                },
              ]}
              onPress={() => setViewMode("grid")}
              activeOpacity={0.7}
            >
              <IconLayoutGrid
                size={16}
                color={
                  viewMode === "grid"
                    ? colors.primaryForeground
                    : colors.foreground
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {hasDocuments ? (
          <>
            {renderFileSection(
              "Orçamentos",
              budgets,
              <IconCurrencyReal size={20} color="#10b981" />,
              "#10b981"
            )}
            {renderFileSection(
              "Notas Fiscais",
              invoices,
              <IconFileInvoice size={20} color="#3b82f6" />,
              "#3b82f6"
            )}
            {renderFileSection(
              "Recibos",
              receipts,
              <IconReceipt size={20} color="#a855f7" />,
              "#a855f7"
            )}
            {renderFileSection(
              "Reembolsos",
              reimbursements,
              <IconCurrencyReal size={20} color="#f97316" />,
              "#f97316"
            )}
            {renderFileSection(
              "NFEs de Reembolso",
              invoiceReimbursements,
              <IconFileInvoice size={20} color="#ef4444" />,
              "#ef4444"
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.muted + "30" },
              ]}
            >
              <IconFileText size={32} color={colors.mutedForeground} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum documento cadastrado
            </ThemedText>
            <ThemedText
              style={[
                styles.emptyDescription,
                { color: colors.mutedForeground },
              ]}
            >
              Este pedido não possui documentos anexados.
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  viewModeButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  viewModeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  sectionCount: {
    fontSize: fontSize.sm,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  listContainer: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
