import { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconFileText, IconFileCheck } from '@tabler/icons-react-native';
import { getCurrentApiUrl, getTokenProvider } from '@/api-client';
import type { Warning } from '@/types';
import { DetailCard } from '@/components/ui/detail-page-layout';

interface ViewWarningDocumentButtonProps {
  warning: Warning;
}

/**
 * Downloads the warning term as a real PDF from the server and opens the native
 * share sheet. Mirrors the web detail "Ver Documento / Ver Termo Assinado"
 * action: the endpoint serves the PAdES-sealed term once the warning is
 * signed/refused, otherwise a freshly-rendered preview (so it works even before
 * any signature exists). The auth token is attached so the request is
 * authenticated.
 */
export function ViewWarningDocumentButton({ warning }: ViewWarningDocumentButtonProps) {
  const { colors } = useTheme();
  const [downloading, setDownloading] = useState(false);

  // A sealed/stored term exists once any signature carries a signedDocument.
  const hasSignedTerm = (warning.signatures || []).some(
    (s) => !!(s.signedDocument?.id || s.signedDocumentId),
  );

  const actionLabel = hasSignedTerm ? 'Ver Termo Assinado' : 'Ver Documento';

  const handleViewDocument = async () => {
    try {
      setDownloading(true);

      const apiUrl = getCurrentApiUrl();
      const documentUrl = `${apiUrl}/warnings/${warning.id}/document`;

      // Attach the auth token for the download request.
      const tokenProvider = getTokenProvider();
      const token = tokenProvider ? await tokenProvider() : null;

      const fileUri = `${FileSystem.cacheDirectory}advertencia-${warning.id}.pdf`;

      const downloadResult = await FileSystem.downloadAsync(documentUrl, fileUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (downloadResult.status !== 200) {
        throw new Error('Download falhou');
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Termo de Advertência',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sucesso', 'Documento baixado com sucesso.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o documento da advertência.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DetailCard title="Documento" icon="file-text">
      {downloading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Gerando documento...
          </ThemedText>
        </View>
      ) : (
        <Button
          onPress={handleViewDocument}
          style={StyleSheet.flatten([styles.button, { backgroundColor: colors.primary }])}
        >
          {hasSignedTerm ? (
            <IconFileCheck size={18} color="#ffffff" />
          ) : (
            <IconFileText size={18} color="#ffffff" />
          )}
          <ThemedText style={styles.buttonText}>{actionLabel}</ThemedText>
        </Button>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
});
