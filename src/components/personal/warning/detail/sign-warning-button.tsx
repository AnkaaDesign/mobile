import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconFingerprint, IconCheck, IconAlertTriangle } from '@tabler/icons-react-native';
import { useWarningSignature } from '@/hooks/useWarningSignature';
import { WARNING_SIGNING_STEP_LABELS } from '@/services/warning-signing';
import { useAuth } from '@/contexts/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Warning } from '@/types';
import { DetailCard } from '@/components/ui/detail-page-layout';

const LGPD_CONSENT_KEY = 'warning_lgpd_consent_given';

interface SignWarningButtonProps {
  warning: Warning;
}

/**
 * In-app electronic signature button for a warning ("Advertência").
 *
 * Visible when the logged-in user is the COLLABORATOR or a WITNESS of the
 * warning AND has not yet signed. The same button serves both — the API infers
 * the role from the logged-in user. The label adapts ("Assinar como
 * Testemunha" when the user is a witness).
 */
export function SignWarningButton({ warning }: SignWarningButtonProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { state, sign, reset, isLoading } = useWarningSignature();

  const userId = user?.id;

  // Determine the viewer's role relative to this warning.
  const isCollaborator = !!userId && warning.collaboratorId === userId;
  const isWitness = !!userId && (warning.witness || []).some((w) => w.id === userId);

  // Has the viewer already signed (non-refusal signature)?
  const alreadySigned =
    !!userId &&
    (warning.signatures || []).some(
      (s) => !s.refused && s.signedByUserId === userId,
    );

  // Show only to participants who haven't signed yet.
  if ((!isCollaborator && !isWitness) || alreadySigned) {
    // After a successful sign in this session, keep the confirmation visible.
    if (state.step !== 'completed') return null;
  }

  const isWitnessLabel = isWitness && !isCollaborator;
  const actionLabel = isWitnessLabel ? 'Assinar como Testemunha' : 'Confirmar Ciência e Assinar';

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
      'Para registrar sua assinatura eletrônica desta advertência, coletaremos as seguintes informações:\n\n' +
        '• Confirmação biométrica (sem armazenar dados biométricos)\n' +
        '• Informações do dispositivo (modelo, sistema operacional)\n' +
        '• Localização aproximada (precisão de ~11m)\n' +
        '• Data e hora\n\n' +
        'Esses dados são coletados exclusivamente para comprovação legal da ciência/assinatura da advertência.\n\n' +
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
      isWitnessLabel ? 'Assinar como Testemunha' : 'Confirmar Ciência',
      isWitnessLabel
        ? 'Você confirma que testemunhou esta advertência? Será solicitada autenticação biométrica.'
        : 'Você confirma a ciência desta advertência? Será solicitada autenticação biométrica.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => sign(warning.id),
        },
      ],
    );
  };

  if (state.step === 'completed') {
    return (
      <DetailCard title="Assinatura Registrada" icon="circle-check" iconColor="#16a34a">
        <View style={styles.completedContent}>
          <IconCheck size={24} color="#16a34a" />
          <ThemedText style={styles.completedText}>
            {state.signerRole === 'WITNESS'
              ? 'Assinatura de testemunha registrada!'
              : 'Ciência registrada com sucesso!'}
          </ThemedText>
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
            {state.error || 'Erro ao assinar advertência'}
          </ThemedText>
        </View>
        <Button onPress={() => { reset(); handleSign(); }} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Tentar novamente</ThemedText>
        </Button>
      </DetailCard>
    );
  }

  return (
    <DetailCard
      title={isWitnessLabel ? 'Assinar como Testemunha' : 'Confirmar Ciência e Assinar'}
      icon="fingerprint"
    >
      <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Assinatura eletrônica com biometria
      </ThemedText>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {WARNING_SIGNING_STEP_LABELS[state.step] || 'Processando...'}
          </ThemedText>
        </View>
      ) : (
        <Button onPress={handleSign} style={StyleSheet.flatten([styles.signButton, { backgroundColor: colors.primary }])}>
          <IconFingerprint size={18} color="#ffffff" />
          <ThemedText style={styles.signButtonText}>{actionLabel}</ThemedText>
        </Button>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: -spacing.xs,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
  },
  signButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  completedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  completedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#16a34a',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
