import { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ui/themed-text';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/lib/theme';
import { spacing, fontSize, fontWeight } from '@/constants/design-system';
import { IconBan, IconCheck, IconAlertTriangle } from '@tabler/icons-react-native';
import { useWarningSignatureRefusal } from '@/hooks/useWarningSignature';
import { WARNING_SIGNING_STEP_LABELS } from '@/services/warning-signing';
import type { Warning } from '@/types';
import { DetailCard } from '@/components/ui/detail-page-layout';

interface RefuseSignatureActionProps {
  warning: Warning;
}

/**
 * Supervisor/HR action to register that the COLLABORATOR refused to sign the
 * warning. Mirrors the API rule: at least 2 witnesses are required. When the
 * warning has fewer than 2, the form is blocked with a clear message telling
 * the user to add witnesses first.
 *
 * Visibility is gated by the caller (HR/supervisor-only detail view).
 */
export function RefuseSignatureAction({ warning }: RefuseSignatureActionProps) {
  const { colors } = useTheme();
  const { state, refuse, reset, isLoading } = useWarningSignatureRefusal();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Has the collaborator already refused?
  const alreadyRefused = (warning.signatures || []).some((s) => s.refused);
  if (alreadyRefused && state.step !== 'completed') return null;

  const witnessCount = (warning.witness || []).length;
  const hasEnoughWitnesses = witnessCount >= 2;

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert('Motivo obrigatório', 'Informe o motivo da recusa de assinatura.');
      return;
    }
    Alert.alert(
      'Registrar Recusa',
      'Confirma o registro de que o colaborador recusou-se a assinar esta advertência? Esta ação ficará registrada com as testemunhas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => refuse(warning.id, trimmed) },
      ],
    );
  };

  if (state.step === 'completed') {
    return (
      <DetailCard title="Recusa Registrada" icon="circle-check" iconColor="#16a34a">
        <View style={styles.row}>
          <IconCheck size={24} color="#16a34a" />
          <ThemedText style={styles.completedText}>
            Recusa de assinatura registrada com sucesso.
          </ThemedText>
        </View>
      </DetailCard>
    );
  }

  return (
    <DetailCard title="Recusa de Assinatura" icon="ban" iconColor="#ef4444">
      <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Registre que o colaborador recusou-se a assinar a advertência.
      </ThemedText>

      {!hasEnoughWitnesses ? (
        <View style={[styles.warningBox, { borderColor: '#f59e0b', backgroundColor: '#f59e0b20' }]}>
          <IconAlertTriangle size={20} color="#b45309" />
          <ThemedText style={[styles.warningText, { color: '#b45309' }]}>
            São necessárias ao menos 2 testemunhas para registrar a recusa de assinatura.
            {' '}Adicione testemunhas à advertência antes de continuar
            {` (atualmente: ${witnessCount}).`}
          </ThemedText>
        </View>
      ) : !open ? (
        <Button
          onPress={() => setOpen(true)}
          style={StyleSheet.flatten([styles.openButton, { backgroundColor: '#ef4444' }])}
        >
          <IconBan size={18} color="#ffffff" />
          <ThemedText style={styles.openButtonText}>Registrar "Recusou assinar"</ThemedText>
        </Button>
      ) : (
        <View style={styles.form}>
          <ThemedText style={[styles.label, { color: colors.foreground }]}>
            Motivo da recusa
          </ThemedText>
          <Textarea
            value={reason}
            onChangeText={setReason}
            placeholder="Descreva o motivo informado / observado"
            numberOfLines={4}
          />

          {state.step === 'error' && (
            <View style={styles.errorRow}>
              <IconAlertTriangle size={18} color="#ef4444" />
              <ThemedText style={[styles.errorText, { color: '#ef4444' }]}>
                {state.error || 'Erro ao registrar recusa.'}
              </ThemedText>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
                {WARNING_SIGNING_STEP_LABELS[state.step] || 'Processando...'}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.actions}>
              <Button
                onPress={() => { reset(); setOpen(false); }}
                style={StyleSheet.flatten([styles.cancelButton, { borderColor: colors.border }])}
              >
                <ThemedText style={[styles.cancelButtonText, { color: colors.foreground }]}>
                  Cancelar
                </ThemedText>
              </Button>
              <Button
                onPress={handleSubmit}
                style={StyleSheet.flatten([styles.submitButton, { backgroundColor: '#ef4444' }])}
              >
                <ThemedText style={styles.submitButtonText}>Registrar Recusa</ThemedText>
              </Button>
            </View>
          )}
        </View>
      )}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: fontSize.xs,
    marginTop: -spacing.xs,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
  },
  completedText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#16a34a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
