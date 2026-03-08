import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconFingerprint, IconCheck, IconAlertTriangle } from '@tabler/icons-react-native';
import { usePpeSignature } from '@/hooks/usePpeSignature';
import { PPE_SIGNING_STEP_LABELS } from '@/services/ppe-signing';
import { PPE_DELIVERY_STATUS } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PpeDelivery } from '@/types/ppe';
import { DetailCard } from '@/components/ui/detail-page-layout';

const LGPD_CONSENT_KEY = 'ppe_lgpd_consent_given';

interface SignDeliveryButtonProps {
  delivery: PpeDelivery;
}

export function SignDeliveryButton({ delivery }: SignDeliveryButtonProps) {
  const { colors } = useTheme();
  const { state, sign, reset, isLoading } = usePpeSignature();

  // Only show for deliveries that can be signed
  const canSign =
    delivery.status === PPE_DELIVERY_STATUS.DELIVERED ||
    delivery.status === PPE_DELIVERY_STATUS.WAITING_SIGNATURE;

  if (!canSign) return null;

  const handleSign = async () => {
    // Check LGPD consent
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
      'Para confirmar o recebimento do EPI, coletaremos as seguintes informações:\n\n' +
        '• Confirmação biométrica (sem armazenar dados biométricos)\n' +
        '• Informações do dispositivo (modelo, sistema operacional)\n' +
        '• Localização aproximada (precisão de ~11m)\n' +
        '• Data e hora\n\n' +
        'Esses dados são coletados exclusivamente para comprovação legal de entrega de EPI conforme NR-6.\n\n' +
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
      'Confirmar Recebimento',
      'Você confirma o recebimento deste EPI? Será solicitada autenticação biométrica.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => sign(delivery.id),
        },
      ],
    );
  };

  if (state.step === 'completed') {
    return (
      <DetailCard title="Recebimento Confirmado" icon="circle-check" iconColor="#16a34a">
        <View style={styles.completedContent}>
          <IconCheck size={24} color="#16a34a" />
          <ThemedText style={styles.completedText}>Recebimento confirmado!</ThemedText>
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
            {state.error || 'Erro ao assinar entrega'}
          </ThemedText>
        </View>
        <Button onPress={() => { reset(); handleSign(); }} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Tentar novamente</ThemedText>
        </Button>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Confirmar Recebimento" icon="fingerprint">
      <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Assinatura eletrônica com biometria
      </ThemedText>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {PPE_SIGNING_STEP_LABELS[state.step] || 'Processando...'}
          </ThemedText>
        </View>
      ) : (
        <Button onPress={handleSign} style={StyleSheet.flatten([styles.signButton, { backgroundColor: colors.primary }])}>
          <IconFingerprint size={18} color="#ffffff" />
          <ThemedText style={styles.signButtonText}>Confirmar Recebimento</ThemedText>
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
