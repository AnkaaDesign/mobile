import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components/ui/themed-safe-area-view';
import { useColorScheme } from 'nativewind';
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useGovbrSigning } from '@/hooks/useGovbrSigning';
import { GovbrEnvironment, SigningStep } from '@/services/govbr-signing/types';
import {
  IconFileText,
  IconCheck,
  IconX,
  IconRefresh,
  IconHash,
  IconLock,
  IconPencil,
  IconCircleDot,
} from '@tabler/icons-react-native';

const STEP_LABELS: Record<SigningStep, string> = {
  idle: 'Aguardando',
  picking_document: 'Selecionando documento...',
  hashing: 'Calculando hash...',
  authenticating: 'Autenticando com Gov.br...',
  signing: 'Assinando documento...',
  completed: 'Documento assinado!',
  error: 'Erro na assinatura',
};

const STEPS_ORDER: SigningStep[] = [
  'hashing',
  'authenticating',
  'signing',
  'completed',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStepIndex(step: SigningStep): number {
  return STEPS_ORDER.indexOf(step);
}

export default function AssinaturaGovbrScreen() {
  useScreenReady();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [environment, setEnvironment] =
    useState<GovbrEnvironment>('staging');

  const { state, pickDocument, signDocument, reset } =
    useGovbrSigning(environment);

  const isProcessing = ['hashing', 'authenticating', 'signing'].includes(
    state.step,
  );
  const canSign = state.document && !isProcessing && state.step !== 'completed';

  const cardBg = isDarkMode ? '#1c1c1e' : '#ffffff';
  const cardBorder = isDarkMode ? '#2c2c2e' : '#e5e7eb';
  const textPrimary = isDarkMode ? '#f9fafb' : '#111827';
  const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
  const accentGreen = '#22c55e';
  const accentBlue = '#3b82f6';
  const accentRed = '#ef4444';

  return (
    <ThemedSafeAreaView className="flex-1 bg-background">
      <View className="flex-1">
        <View className="px-4 py-4 border-b border-border">
          <Text className="text-xl font-bold text-foreground">
            Assinatura Digital Gov.br (Teste)
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            Prova de conceito - Assinatura via ITI/Gov.br
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Document Selection Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <IconFileText size={20} color={accentBlue} />
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Documento
              </Text>
            </View>

            {state.document ? (
              <View style={styles.documentInfo}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.documentName, { color: textPrimary }]}
                    numberOfLines={1}
                  >
                    {state.document.name}
                  </Text>
                  <Text style={[styles.documentSize, { color: textSecondary }]}>
                    {formatFileSize(state.document.size)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={pickDocument}
                  disabled={isProcessing}
                  style={[
                    styles.smallButton,
                    { borderColor: cardBorder },
                    isProcessing && styles.buttonDisabled,
                  ]}
                >
                  <Text style={[styles.smallButtonText, { color: accentBlue }]}>
                    Trocar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickDocument}
                disabled={isProcessing}
                style={[styles.selectButton, { borderColor: accentBlue }]}
              >
                <IconFileText size={18} color={accentBlue} />
                <Text style={[styles.selectButtonText, { color: accentBlue }]}>
                  Selecionar PDF
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Environment Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <IconCircleDot size={20} color={accentBlue} />
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Ambiente
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setEnvironment('staging')}
                disabled={isProcessing}
                style={[
                  styles.toggleButton,
                  environment === 'staging' && {
                    backgroundColor: accentBlue,
                    borderColor: accentBlue,
                  },
                  environment !== 'staging' && { borderColor: cardBorder },
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color:
                        environment === 'staging' ? '#fff' : textSecondary,
                    },
                  ]}
                >
                  Staging
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEnvironment('production')}
                disabled={isProcessing}
                style={[
                  styles.toggleButton,
                  environment === 'production' && {
                    backgroundColor: accentBlue,
                    borderColor: accentBlue,
                  },
                  environment !== 'production' && { borderColor: cardBorder },
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color:
                        environment === 'production' ? '#fff' : textSecondary,
                    },
                  ]}
                >
                  Production
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Signing Flow Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <IconLock size={20} color={accentBlue} />
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Fluxo de Assinatura
              </Text>
            </View>

            {/* Sign Button */}
            <TouchableOpacity
              onPress={signDocument}
              disabled={!canSign}
              style={[
                styles.signButton,
                { backgroundColor: canSign ? accentGreen : cardBorder },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconPencil size={18} color="#fff" />
              )}
              <Text style={styles.signButtonText}>
                {isProcessing ? 'Processando...' : 'Assinar Documento'}
              </Text>
            </TouchableOpacity>

            {/* Step Indicator */}
            {state.step !== 'idle' && state.step !== 'picking_document' && (
              <View style={styles.stepsContainer}>
                {STEPS_ORDER.map((step, index) => {
                  const currentIndex = getStepIndex(state.step);
                  const isActive = state.step === step;
                  const isDone =
                    currentIndex > index ||
                    (state.step === 'completed' && step === 'completed');
                  const isPending = currentIndex < index;

                  let iconColor = textSecondary;
                  if (isDone) iconColor = accentGreen;
                  if (isActive && state.step !== 'completed')
                    iconColor = accentBlue;
                  if (state.step === 'error' && isActive)
                    iconColor = accentRed;

                  return (
                    <View key={step} style={styles.stepRow}>
                      <View style={styles.stepIcon}>
                        {isDone ? (
                          <IconCheck size={16} color={accentGreen} />
                        ) : isActive && state.step !== 'error' ? (
                          <ActivityIndicator size="small" color={accentBlue} />
                        ) : state.step === 'error' && isActive ? (
                          <IconX size={16} color={accentRed} />
                        ) : (
                          <View
                            style={[
                              styles.stepDot,
                              {
                                backgroundColor: isPending
                                  ? cardBorder
                                  : iconColor,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color: isPending ? textSecondary : iconColor,
                            fontWeight: isActive ? '600' : '400',
                          },
                        ]}
                      >
                        {STEP_LABELS[step]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Result Card */}
          {state.step === 'completed' && state.signature && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: accentGreen,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <IconCheck size={20} color={accentGreen} />
                <Text style={[styles.cardTitle, { color: accentGreen }]}>
                  Assinatura Concluida
                </Text>
              </View>

              {state.signedAt && (
                <Text style={[styles.resultLabel, { color: textSecondary }]}>
                  Assinado em:{' '}
                  <Text style={{ color: textPrimary }}>
                    {new Date(state.signedAt).toLocaleString('pt-BR')}
                  </Text>
                </Text>
              )}

              {state.hashBase64 && (
                <View style={styles.resultBlock}>
                  <Text
                    style={[styles.resultLabel, { color: textSecondary }]}
                  >
                    Hash SHA-256:
                  </Text>
                  <Text
                    style={[styles.resultValue, { color: textPrimary }]}
                    numberOfLines={2}
                  >
                    {state.hashBase64}
                  </Text>
                </View>
              )}

              <View style={styles.resultBlock}>
                <Text style={[styles.resultLabel, { color: textSecondary }]}>
                  Assinatura PKCS7:
                </Text>
                <Text
                  style={[styles.resultValue, { color: textPrimary }]}
                  numberOfLines={3}
                >
                  {state.signature.substring(0, 120)}...
                </Text>
              </View>

              <TouchableOpacity
                onPress={reset}
                style={[
                  styles.resetButton,
                  { borderColor: accentBlue },
                ]}
              >
                <IconRefresh size={16} color={accentBlue} />
                <Text style={[styles.resetButtonText, { color: accentBlue }]}>
                  Nova Assinatura
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Card */}
          {state.step === 'error' && state.error && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: accentRed,
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <IconX size={20} color={accentRed} />
                <Text style={[styles.cardTitle, { color: accentRed }]}>
                  Erro
                </Text>
              </View>

              <Text style={[styles.errorText, { color: textPrimary }]}>
                {state.error}
              </Text>

              <TouchableOpacity
                onPress={reset}
                style={[styles.resetButton, { borderColor: accentRed }]}
              >
                <IconRefresh size={16} color={accentRed} />
                <Text style={[styles.resetButtonText, { color: accentRed }]}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    marginTop: 2,
  },
  smallButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
  },
  selectButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  signButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  stepsContainer: {
    marginTop: 16,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 14,
  },
  resultBlock: {
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
