// sign-lgpd-button.tsx (mobile)
// "Assinar Termo LGPD" — in-app electronic signature of the admission LGPD_TERM
// document. Mirrors the PPE SignDeliveryButton pattern: LGPD consent dialog →
// biometric confirmation → evidence collection + SHA-256 hash → POST sign.
//
// REUSES the PPE signing infrastructure unchanged:
//   - the evidence helpers (authenticateWithBiometric / collectAllEvidence /
//     computeEvidenceHash) via the document-signing service,
//   - the consent-persistence pattern (AsyncStorage LGPD_CONSENT_KEY),
//   - the step-label map (PPE_SIGNING_STEP_LABELS).
// The signed status / evidence (signedAt, signer, PAdES seal) is shown afterward.

import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconFingerprint, IconCheck, IconAlertTriangle, IconShieldCheck } from '@tabler/icons-react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { DetailCard } from '@/components/ui/detail-page-layout';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { PPE_SIGNING_STEP_LABELS } from '@/services/ppe-signing/types';
import { useAdmissionDocumentSignature } from '@/hooks/useAdmissionDocumentSignature';
import { ADMISSION_DOCUMENT_STATUS } from '@/constants';
import { formatDateTime } from '@/utils/date';
import type { AdmissionDocument } from '@/types/admission';

// Shared with the PPE flow — same consent gate, persisted once per device.
const LGPD_CONSENT_KEY = 'ppe_lgpd_consent_given';

interface SignLgpdButtonProps {
  document: AdmissionDocument;
}

function isDocumentSigned(document: AdmissionDocument): boolean {
  return document.status === ADMISSION_DOCUMENT_STATUS.SIGNED || !!document.signedAt || !!document.signedFileId;
}

export function SignLgpdButton({ document }: SignLgpdButtonProps) {
  const { colors } = useTheme();
  const { state, sign, reset, isLoading } = useAdmissionDocumentSignature();

  // Already signed — show evidence summary (parity with web documents-card).
  if (isDocumentSigned(document) && state.step !== 'completed') {
    return <SignedSummary document={document} />;
  }

  // The document needs an existing source file to sign over (server 400s otherwise).
  const missingSourceFile = !document.fileId;

  const handleSign = async () => {
    const consentGiven = await AsyncStorage.getItem(LGPD_CONSENT_KEY);
    if (!consentGiven) {
      showConsentDialog();
      return;
    }
    showConfirmationDialog();
  };

  const showConsentDialog = () => {
    Alert.alert(
      'Consentimento LGPD',
      'Para assinar o Termo LGPD eletronicamente, coletaremos as seguintes informações:\n\n' +
        '• Confirmação biométrica (sem armazenar dados biométricos)\n' +
        '• Informações do dispositivo (modelo, sistema operacional)\n' +
        '• Localização aproximada (precisão de ~11m)\n' +
        '• Data e hora\n\n' +
        'Esses dados são coletados exclusivamente para comprovação legal da assinatura.\n\n' +
        'Ao confirmar, você consente com a coleta desses dados conforme LGPD Art. 7°.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concordo',
          onPress: async () => {
            await AsyncStorage.setItem(LGPD_CONSENT_KEY, 'true');
            showConfirmationDialog();
          },
        },
      ],
    );
  };

  const showConfirmationDialog = () => {
    Alert.alert(
      'Assinar Termo LGPD',
      'Você confirma a assinatura eletrônica do Termo LGPD? Será solicitada autenticação biométrica.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Assinar', onPress: () => sign(document.id) },
      ],
    );
  };

  if (state.step === 'completed') {
    return (
      <DetailCard title="Termo LGPD Assinado" icon="circle-check" iconColor="#16a34a">
        <View style={styles.completedContent}>
          <IconCheck size={24} color="#16a34a" />
          <ThemedText style={styles.completedText}>Termo LGPD assinado eletronicamente!</ThemedText>
        </View>
      </DetailCard>
    );
  }

  if (state.step === 'error') {
    return (
      <DetailCard title="Erro na Assinatura" icon="alert-triangle" iconColor="#ef4444">
        <View style={styles.errorContent}>
          <IconAlertTriangle size={20} color="#ef4444" />
          <ThemedText style={[styles.errorText, { color: '#ef4444' }]}>
            {state.error || 'Erro ao assinar o Termo LGPD'}
          </ThemedText>
        </View>
        <Button onPress={() => { reset(); handleSign(); }} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Tentar novamente</ThemedText>
        </Button>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Assinar Termo LGPD" icon="fingerprint">
      <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Assinatura eletrônica com biometria
      </ThemedText>

      {missingSourceFile ? (
        <View style={styles.errorContent}>
          <IconAlertTriangle size={18} color="#d97706" />
          <ThemedText style={[styles.errorText, { color: colors.mutedForeground }]}>
            Anexe o arquivo do Termo LGPD antes de assinar.
          </ThemedText>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {PPE_SIGNING_STEP_LABELS[state.step] || 'Processando...'}
          </ThemedText>
        </View>
      ) : (
        <Button onPress={handleSign} style={StyleSheet.flatten([styles.signButton, { backgroundColor: colors.primary }])}>
          <IconFingerprint size={18} color="#ffffff" />
          <ThemedText style={styles.signButtonText}>Assinar Termo LGPD</ThemedText>
        </Button>
      )}
    </DetailCard>
  );
}

function SignedSummary({ document }: { document: AdmissionDocument }) {
  return (
    <DetailCard title="Termo LGPD Assinado" icon="circle-check" iconColor="#16a34a">
      <View style={styles.signedSummary}>
        <View style={styles.completedContent}>
          <IconCheck size={20} color="#16a34a" />
          <ThemedText style={styles.completedText}>
            Assinado
            {document.signedAt ? ` em ${formatDateTime(document.signedAt)}` : ''}
            {document.signedBy?.name ? ` por ${document.signedBy.name}` : ''}
          </ThemedText>
        </View>
        {document.padesSealed && (
          <View style={styles.padesRow}>
            <IconShieldCheck size={16} color="#16a34a" />
            <ThemedText style={[styles.padesText, { color: '#16a34a' }]}>Selo PAdES (ICP-Brasil) aplicado</ThemedText>
          </View>
        )}
      </View>
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: fontSize.xs, marginTop: -spacing.xs },
  signButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm + 2, borderRadius: 8,
  },
  signButtonText: { color: '#ffffff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  loadingContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm,
  },
  loadingText: { fontSize: fontSize.sm },
  completedContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  completedText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: '#16a34a', flex: 1 },
  signedSummary: { gap: spacing.sm },
  padesRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  padesText: { fontSize: fontSize.xs },
  errorContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  errorText: { fontSize: fontSize.sm, flex: 1 },
  retryButton: { backgroundColor: '#ef4444', paddingVertical: spacing.sm, borderRadius: 8, alignItems: 'center', marginTop: spacing.sm },
  retryButtonText: { color: '#ffffff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
});
