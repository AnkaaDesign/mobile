import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { useNfseDetail } from "@/hooks/useNfse";
import { getCurrentApiUrl, getTokenProvider } from "@/api-client";
import { IconFileDownload } from "@tabler/icons-react-native";

interface NfseEnrichedInfoProps {
  elotechNfseId: number;
  showPdfLink?: boolean;
}

export function NfseEnrichedInfo({ elotechNfseId, showPdfLink = false }: NfseEnrichedInfoProps) {
  const { colors } = useTheme();
  const { data: detail, isLoading } = useNfseDetail(elotechNfseId);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);

      const apiUrl = getCurrentApiUrl();
      const pdfUrl = `${apiUrl}/nfse/${elotechNfseId}/pdf`;

      // Get auth token for the download request
      const tokenProvider = getTokenProvider();
      const token = tokenProvider ? await tokenProvider() : null;

      const fileUri = `${FileSystem.cacheDirectory}nfse-${elotechNfseId}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (downloadResult.status !== 200) {
        throw new Error("Download falhou");
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: "NFS-e PDF",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Sucesso", "PDF baixado com sucesso");
      }
    } catch (error) {
      console.error("[NfseEnrichedInfo] PDF download error:", error);
      Alert.alert("Erro", "Erro ao baixar PDF da NFS-e");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!detail) return null;

  const numeroNfse = detail.formDadosNFSe?.numeroNfse;
  const dataEmissao = detail.formDadosNFSe?.dataEmissao;
  const totalNfse = detail.formTotal?.totalNfse;
  const valorIss = detail.formImposto?.valorIss;

  return (
    <View style={[styles.container, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <View style={styles.grid}>
        {/* Row 1 */}
        <View style={styles.gridItem}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            NUMERO
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {numeroNfse ?? "-"}
          </ThemedText>
        </View>
        <View style={styles.gridItem}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            EMISSAO
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {formatDate(dataEmissao)}
          </ThemedText>
        </View>

        {/* Row 2 */}
        <View style={styles.gridItem}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            VALOR
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {formatCurrency(totalNfse)}
          </ThemedText>
        </View>
        <View style={styles.gridItem}>
          <ThemedText style={[styles.label, { color: colors.mutedForeground }]}>
            ISS
          </ThemedText>
          <ThemedText style={[styles.value, { color: colors.foreground }]}>
            {formatCurrency(valorIss)}
          </ThemedText>
        </View>
      </View>

      {showPdfLink && (
        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={downloading}
          style={[styles.pdfButton, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <IconFileDownload size={16} color="#fff" />
              <ThemedText style={styles.pdfButtonText}>Baixar PDF</ThemedText>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "50%",
    paddingVertical: spacing.xs,
    gap: 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: "uppercase",
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  pdfButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  pdfButtonText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
