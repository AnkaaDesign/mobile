import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Card } from '@/components/ui/card';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconShieldCheck, IconDeviceMobile, IconClock, IconMapPin } from '@tabler/icons-react-native';
import { usePpeSignatureVerification } from '@/hooks/usePpeSignature';
import { PpeDeliveryService } from '@/api-client/ppe';
import { formatDate } from '@/utils';
import type { PpeDeliverySignature, BiometricMethod } from '@/types/ppe';

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
      <Card style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </Card>
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

  // Mask CPF: full digits → ***.456.789-**
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
    <Card style={[styles.card, { borderColor: '#22c55e' }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <IconShieldCheck size={20} color="#16a34a" />
          <ThemedText style={[styles.title, { color: '#16a34a' }]}>
            Assinatura Eletrônica Verificada
          </ThemedText>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Signer */}
        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
            Assinante
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
            {signerName}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
            CPF
          </ThemedText>
          <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
            {maskedCpf}
          </ThemedText>
        </View>

        {/* Biometric */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <IconDeviceMobile size={14} color={colors.mutedForeground} style={styles.infoIcon} />
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Autenticação
            </ThemedText>
          </View>
          <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
            {biometricLabel}
          </ThemedText>
        </View>

        {/* Timestamps */}
        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <IconClock size={14} color={colors.mutedForeground} style={styles.infoIcon} />
            <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
              Data/Hora
            </ThemedText>
          </View>
          <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
            {data.serverTimestamp
              ? formatDate(new Date(data.serverTimestamp))
              : data.clientTimestamp
                ? formatDate(new Date(data.clientTimestamp))
                : '-'}
          </ThemedText>
        </View>

        {/* Location */}
        {data.latitude != null && data.longitude != null && (
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <IconMapPin size={14} color={colors.mutedForeground} style={styles.infoIcon} />
              <ThemedText style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                Localização
              </ThemedText>
            </View>
            <ThemedText style={[styles.infoValue, { color: colors.foreground }]}>
              {Number(data.latitude).toFixed(4)}, {Number(data.longitude).toFixed(4)}
            </ThemedText>
          </View>
        )}

        {/* Verification code */}
        {verificationCode && (
          <View style={[styles.verificationRow, { backgroundColor: '#f0fdf4' }]}>
            <ThemedText style={[styles.verificationLabel, { color: colors.mutedForeground }]}>
              Código de verificação
            </ThemedText>
            <ThemedText style={styles.verificationCode}>
              {verificationCode}
            </ThemedText>
          </View>
        )}

        {/* Verify button */}
        <Button
          onPress={handleVerify}
          disabled={verifyMutation.isPending}
          style={[styles.verifyButton, { borderColor: '#22c55e' }]}
        >
          {verifyMutation.isPending ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <ThemedText style={styles.verifyButtonText}>Verificar Integridade</ThemedText>
          )}
        </Button>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  content: {
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: spacing.xs,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  verificationRow: {
    padding: spacing.sm,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificationLabel: {
    fontSize: fontSize.xs,
  },
  verificationCode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
    color: '#16a34a',
    letterSpacing: 1,
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
