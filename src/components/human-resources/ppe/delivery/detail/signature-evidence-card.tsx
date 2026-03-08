import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconFileText } from '@tabler/icons-react-native';
import { usePpeSignatureVerification } from '@/hooks/usePpeSignature';
import { PpeDeliveryService } from '@/api-client/ppe';
import { formatDate } from '@/utils';
import { API_BASE_URL } from '@/config/urls';
import type { PpeDeliverySignature, BiometricMethod } from '@/types/ppe';
import { DetailCard, DetailField } from '@/components/ui/detail-page-layout';

const BIOMETRIC_LABELS: Record<BiometricMethod, string> = {
  FINGERPRINT: 'Impressão Digital',
  FACE_ID: 'Reconhecimento Facial',
  IRIS: 'Reconhecimento de Íris',
  DEVICE_PIN: 'PIN do Dispositivo',
  NONE: 'Nenhuma',
};

interface SignatureEvidenceCardProps {
  deliveryId: string;
  signature?: PpeDeliverySignature | null;
}

export function SignatureEvidenceCard({ deliveryId, signature }: SignatureEvidenceCardProps) {
  const { colors } = useTheme();
  const verifyMutation = usePpeSignatureVerification();
  const [signatureDetails, setSignatureDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch signature details from API if not provided via props
  useEffect(() => {
    if (signature || signatureDetails || loadingDetails) return;

    setLoadingDetails(true);
    PpeDeliveryService.getSignatureDetails(deliveryId)
      .then(result => setSignatureDetails(result.data))
      .catch(() => {/* No signature exists */})
      .finally(() => setLoadingDetails(false));
  }, [deliveryId, signature, signatureDetails, loadingDetails]);

  const data = signatureDetails || signature;

  if (loadingDetails) {
    return (
      <DetailCard title="Assinatura Eletrônica" icon="shield-check" iconColor="#16a34a">
        <ActivityIndicator size="small" color={colors.primary} />
      </DetailCard>
    );
  }

  if (!data) return null;

  const handleVerify = () => {
    verifyMutation.mutate(deliveryId, {
      onSuccess: (result) => {
        Alert.alert(
          result.valid ? 'Integridade Verificada' : 'Falha na Verificação',
          result.details || (result.valid ? 'Assinatura íntegra.' : 'Dados podem ter sido adulterados.'),
        );
      },
      onError: (error: Error) => {
        Alert.alert('Erro', error.message || 'Erro ao verificar assinatura.');
      },
    });
  };

  // Mask CPF: full digits -> ***.456.789-**
  const maskedCpf = data.signedByCpf
    ? (() => {
        const d = (data.signedByCpf as string).replace(/\D/g, '');
        return d.length >= 11 ? `***.${d.substring(3, 6)}.${d.substring(6, 9)}-**` : data.signedByCpf;
      })()
    : data.signedBy?.cpf || '***.***.***-**';

  const signerName = data.signedByUser?.name || data.signedBy?.name || 'Desconhecido';
  const biometricLabel = BIOMETRIC_LABELS[data.biometricMethod as BiometricMethod] || data.biometricMethod;
  const verificationCode = (data.hmacSignature || data.verificationCode || '').substring(0, 16).toUpperCase();

  return (
    <DetailCard title="Assinatura Eletrônica Verificada" icon="shield-check" iconColor="#16a34a">
      <DetailField label="Assinante" icon="user" value={signerName} />
      <DetailField label="CPF" icon="id" value={maskedCpf} />
      <DetailField label="Autenticação" icon="device-mobile" value={biometricLabel} />
      <DetailField
        label="Data/Hora"
        icon="clock"
        value={
          data.serverTimestamp
            ? formatDate(new Date(data.serverTimestamp))
            : data.clientTimestamp
              ? formatDate(new Date(data.clientTimestamp))
              : '-'
        }
      />

      {data.latitude != null && data.longitude != null && (
        <DetailField
          label="Localização"
          icon="map-pin"
          value={`${Number(data.latitude).toFixed(4)}, ${Number(data.longitude).toFixed(4)}`}
        />
      )}

      {verificationCode && (
        <DetailField
          label="Código de verificação"
          icon="hash"
          value={verificationCode}
          monospace
        />
      )}

      {/* View Signed PDF */}
      {(data.signedDocumentId || data.signedDocument) && (
        <Button
          onPress={() => {
            const fileId = data.signedDocument?.id || data.signedDocumentId;
            if (fileId) {
              const url = `${API_BASE_URL}/files/serve/${fileId}`;
              Linking.openURL(url).catch(() => {
                Alert.alert('Erro', 'Não foi possível abrir o documento assinado.');
              });
            }
          }}
          style={StyleSheet.flatten([styles.pdfButton, { backgroundColor: '#0a5c1e' }])}
        >
          <View style={styles.pdfButtonContent}>
            <IconFileText size={16} color="#ffffff" />
            <ThemedText style={styles.pdfButtonText}>Ver Termo Assinado (PDF)</ThemedText>
          </View>
        </Button>
      )}

      {/* Verify button */}
      <Button
        onPress={handleVerify}
        disabled={verifyMutation.isPending}
        style={StyleSheet.flatten([styles.verifyButton, { borderColor: '#22c55e' }])}
      >
        {verifyMutation.isPending ? (
          <ActivityIndicator size="small" color="#16a34a" />
        ) : (
          <ThemedText style={styles.verifyButtonText}>Verificar Integridade</ThemedText>
        )}
      </Button>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  pdfButton: {
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  verifyButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#16a34a',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
