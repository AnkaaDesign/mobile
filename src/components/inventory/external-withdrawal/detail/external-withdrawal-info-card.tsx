import { View, StyleSheet } from "react-native";
import { Card } from "@/components/ui/card";
import { ThemedText } from "@/components/ui/themed-text";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import {
  IconPackage,
  IconUser,
  IconCalendar,
  IconCurrencyReal,
  IconNotes,
  IconArrowBack,
  IconFileInvoice,
  IconReceipt,
} from "@tabler/icons-react-native";
import type { ExternalWithdrawal } from "@/types";
import { EXTERNAL_WITHDRAWAL_STATUS, EXTERNAL_WITHDRAWAL_TYPE, EXTERNAL_WITHDRAWAL_TYPE_LABELS } from "@/constants";
import { formatDateTime, formatCurrency } from "@/utils";
import { FileItem, FileViewMode } from "@/components/file/file-item";
import { TouchableOpacity, Linking, Alert } from "react-native";
import { useState } from "react";

interface ExternalWithdrawalInfoCardProps {
  withdrawal: ExternalWithdrawal;
}

const getStatusLabel = (status: EXTERNAL_WITHDRAWAL_STATUS) => {
  const labels = {
    [EXTERNAL_WITHDRAWAL_STATUS.PENDING]: "Pendente",
    [EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED]: "Totalmente Devolvido",
    [EXTERNAL_WITHDRAWAL_STATUS.CHARGED]: "Cobrado",
    [EXTERNAL_WITHDRAWAL_STATUS.CANCELLED]: "Cancelado",
  };
  return labels[status] || status;
};

const getStatusColor = (status: EXTERNAL_WITHDRAWAL_STATUS, colors: any) => {
  const colorMap = {
    [EXTERNAL_WITHDRAWAL_STATUS.PENDING]: colors.warning,
    [EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED]: colors.success,
    [EXTERNAL_WITHDRAWAL_STATUS.CHARGED]: colors.primary,
    [EXTERNAL_WITHDRAWAL_STATUS.CANCELLED]: colors.destructive,
  };
  return colorMap[status] || colors.mutedForeground;
};

export function ExternalWithdrawalInfoCard({ withdrawal }: ExternalWithdrawalInfoCardProps) {
  const { colors } = useTheme();
  const [fileViewMode] = useState<FileViewMode>("list");

  const isFullyReturned = withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.FULLY_RETURNED;
  const isCharged = withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.CHARGED;
  const isCancelled = withdrawal.status === EXTERNAL_WITHDRAWAL_STATUS.CANCELLED;

  // Calculate total price if chargeable
  const totalPrice =
    withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
      ? withdrawal.items?.reduce(
          (sum, item) => sum + item.withdrawedQuantity * (item.price || 0),
          0
        ) || 0
      : 0;

  const handleFilePress = (file: any) => {
    const apiUrl = (global as { __ANKAA_API_URL__?: string }).__ANKAA_API_URL__ || "http://localhost:3030";
    const downloadUrl = `${apiUrl}/files/serve/${file.id}`;

    Alert.alert(
      "Download File",
      `Deseja fazer download de ${file.filename}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Download",
          onPress: () => {
            Linking.openURL(downloadUrl).catch(err => {
              console.error("Failed to open URL:", err);
              Alert.alert("Erro", "Não foi possível abrir o arquivo");
            });
          },
        },
      ]
    );
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
          <IconPackage size={20} color={colors.primary} />
        </View>
        <ThemedText style={styles.headerTitle}>Informações da Retirada Externa</ThemedText>
        <Badge
          variant={
            isFullyReturned
              ? "success"
              : isCharged
              ? "default"
              : isCancelled
              ? "destructive"
              : "secondary"
          }
          style={{ backgroundColor: getStatusColor(withdrawal.status, colors) }}
        >
          {getStatusLabel(withdrawal.status)}
        </Badge>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Withdrawer Information Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Informações do Retirador</ThemedText>
          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconUser size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Nome
                </ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {withdrawal.withdrawerName}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Withdrawal Details Section */}
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + "50", paddingTop: spacing.md }]}>
          <ThemedText style={styles.sectionTitle}>Detalhes da Retirada</ThemedText>

          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconArrowBack size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Tipo de Retirada
                </ThemedText>
              </View>
              <Badge
                variant={
                  withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.RETURNABLE
                    ? "default"
                    : withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE
                    ? "destructive"
                    : "secondary"
                }
              >
                {EXTERNAL_WITHDRAWAL_TYPE_LABELS[withdrawal.type]}
              </Badge>
            </View>
          </View>

          {withdrawal.type === EXTERNAL_WITHDRAWAL_TYPE.CHARGEABLE && (
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLeft}>
                  <IconCurrencyReal size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Valor Total
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatCurrency(totalPrice)}
                </ThemedText>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
              <View style={styles.infoLeft}>
                <IconCalendar size={16} color={colors.mutedForeground} />
                <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Data de Criação
                </ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                {formatDateTime(withdrawal.createdAt)}
              </ThemedText>
            </View>
          </View>

          {withdrawal.updatedAt && withdrawal.updatedAt !== withdrawal.createdAt && (
            <View style={styles.infoRow}>
              <View style={[styles.infoItem, { backgroundColor: colors.muted + "50" }]}>
                <View style={styles.infoLeft}>
                  <IconCalendar size={16} color={colors.mutedForeground} />
                  <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    Última Atualização
                  </ThemedText>
                </View>
                <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
                  {formatDateTime(withdrawal.updatedAt)}
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Files Section */}
        {(withdrawal.nfe || withdrawal.receipt) && (
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + "50", paddingTop: spacing.md }]}>
            <ThemedText style={styles.sectionTitle}>Documentos</ThemedText>

            {withdrawal.nfe && (
              <View style={styles.infoRow}>
                <View style={styles.fileSection}>
                  <View style={styles.fileSectionHeader}>
                    <IconFileInvoice size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Nota Fiscal
                    </ThemedText>
                  </View>
                  <FileItem
                    file={withdrawal.nfe}
                    viewMode={fileViewMode}
                    onPress={handleFilePress}
                    showFilename={true}
                    showFileSize={true}
                    showRelativeTime={false}
                  />
                </View>
              </View>
            )}

            {withdrawal.receipt && (
              <View style={styles.infoRow}>
                <View style={styles.fileSection}>
                  <View style={styles.fileSectionHeader}>
                    <IconReceipt size={16} color={colors.mutedForeground} />
                    <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                      Recibo
                    </ThemedText>
                  </View>
                  <FileItem
                    file={withdrawal.receipt}
                    viewMode={fileViewMode}
                    onPress={handleFilePress}
                    showFilename={true}
                    showFileSize={true}
                    showRelativeTime={false}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Notes Section */}
        {withdrawal.notes && (
          <View style={[styles.section, { borderTopWidth: 1, borderTopColor: colors.border + "50", paddingTop: spacing.md }]}>
            <ThemedText style={styles.sectionTitle}>Observações</ThemedText>
            <View style={[styles.notesContainer, { backgroundColor: colors.muted + "50" }]}>
              <IconNotes size={16} color={colors.mutedForeground} />
              <ThemedText style={[styles.notesText, { color: colors.foreground }]}>
                {withdrawal.notes}
              </ThemedText>
            </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    flex: 1,
    marginLeft: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  notesContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  notesText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  fileSection: {
    flex: 1,
    gap: spacing.sm,
  },
  fileSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
});
