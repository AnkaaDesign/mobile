import { View, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconFileText } from '@tabler/icons-react-native';
import { useWarningSignatureVerification } from '@/hooks/useWarningSignature';
import { formatDateTime } from '@/utils';
import { API_BASE_URL } from '@/config/urls';
import type { Warning, WarningSignature } from '@/types';
import type { BiometricMethod } from '@/types/ppe';
import { DetailCard, DetailField } from '@/components/ui/detail-page-layout';

const BIOMETRIC_LABELS: Record<BiometricMethod, string> = {
  FINGERPRINT: 'Impressão Digital',
  FACE_ID: 'Reconhecimento Facial',
  IRIS: 'Reconhecimento de Íris',
  DEVICE_PIN: 'PIN do Dispositivo',
  NONE: 'Nenhuma',
};

const ROLE_LABELS: Record<string, string> = {
  COLLABORATOR: 'Colaborador',
  WITNESS: 'Testemunha',
};

interface WarningSignatureEvidenceCardProps {
  warning: Warning;
}

/**
 * Lists ALL signatures for a warning (collaborator + each witness) with name,
 * role label, biometric method, date/time and verification code. Refusals show
 * the refusal clause + reason + who registered it. Provides "Ver Termo (PDF)"
 * and "Verificar Integridade" actions.
 */
export function WarningSignatureEvidenceCard({ warning }: WarningSignatureEvidenceCardProps) {
  const { colors } = useTheme();
  const verifyMutation = useWarningSignatureVerification();

  const signatures = warning.signatures || [];
  if (signatures.length === 0) return null;

  const handleVerify = () => {
    verifyMutation.mutate(warning.id, {
      onSuccess: (result) => {
        const lines = (result.signatures || []).map((s) => {
          const role = ROLE_LABELS[s.signerRole] || s.signerRole;
          return `• ${role}: ${s.valid ? 'íntegra' : 'ADULTERADA'}`;
        });
        Alert.alert(
          result.valid ? 'Integridade Verificada' : 'Falha na Verificação',
          result.details ||
            (lines.length > 0
              ? lines.join('\n')
              : result.valid
                ? 'Assinaturas íntegras.'
                : 'Dados podem ter sido adulterados.'),
        );
      },
      onError: (error: Error) => {
        Alert.alert('Erro', error.message || 'Erro ao verificar assinaturas.');
      },
    });
  };

  const openSignedDocument = (signature: WarningSignature) => {
    const fileId = signature.signedDocument?.id || signature.signedDocumentId;
    if (!fileId) return;
    const url = `${API_BASE_URL}/files/serve/${fileId}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o termo assinado.');
    });
  };

  return (
    <DetailCard title="Assinaturas Eletrônicas" icon="shield-check" iconColor="#16a34a">
      {signatures.map((signature, index) => {
        const signerName =
          signature.signedByUser?.name ||
          (signature.refused ? warning.collaborator?.name : null) ||
          'Desconhecido';
        const roleLabel = ROLE_LABELS[signature.signerRole] || signature.signerRole;
        const biometricLabel =
          BIOMETRIC_LABELS[signature.biometricMethod as BiometricMethod] || signature.biometricMethod;
        const verificationCode = (signature.hmacSignature || '').substring(0, 16).toUpperCase();
        const dateValue = signature.serverTimestamp || signature.clientTimestamp;
        const registeredByName = signature.registeredBy?.name;
        const hasDocument = !!(signature.signedDocument?.id || signature.signedDocumentId);

        return (
          <View
            key={signature.id || index}
            style={[
              styles.signatureBlock,
              index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
            ]}
          >
            {signature.refused ? (
              <>
                <DetailField label="Situação" icon="ban" value="Recusou-se a assinar" />
                <DetailField label="Colaborador" icon="user" value={signerName} />
                <DetailField
                  label="Cláusula"
                  icon="gavel"
                  value="O colaborador recusou-se a assinar a presente advertência, conforme registrado abaixo na presença de testemunhas."
                />
                {signature.refusedReason && (
                  <DetailField label="Motivo da recusa" icon="message" value={signature.refusedReason} />
                )}
                {registeredByName && (
                  <DetailField label="Registrado por" icon="user-check" value={registeredByName} />
                )}
              </>
            ) : (
              <>
                <DetailField label="Assinante" icon="user" value={signerName} />
                <DetailField label="Papel" icon="badge" value={roleLabel} />
                <DetailField label="Autenticação" icon="device-mobile" value={biometricLabel} />
              </>
            )}

            <DetailField
              label="Data/Hora"
              icon="clock"
              value={dateValue ? formatDateTime(new Date(dateValue)) : '-'}
            />

            {signature.latitude != null && signature.longitude != null && (
              <DetailField
                label="Localização"
                icon="map-pin"
                value={`${Number(signature.latitude).toFixed(4)}, ${Number(signature.longitude).toFixed(4)}`}
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

            {hasDocument && (
              <Button
                onPress={() => openSignedDocument(signature)}
                style={StyleSheet.flatten([styles.pdfButton, { backgroundColor: '#0a5c1e' }])}
              >
                <View style={styles.pdfButtonContent}>
                  <IconFileText size={16} color="#ffffff" />
                  <ThemedText style={styles.pdfButtonText}>Ver Termo (PDF)</ThemedText>
                </View>
              </Button>
            )}
          </View>
        );
      })}

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
  signatureBlock: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
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
    marginTop: spacing.md,
  },
  verifyButtonText: {
    color: '#16a34a',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
