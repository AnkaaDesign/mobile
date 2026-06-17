import { useState } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ThemedView,
  ThemedText,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  EmptyState,
  ErrorScreen,
  Skeleton,
} from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { spacing } from '@/constants/design-system'
import { SECTOR_PRIVILEGES, THIRTEENTH_STATUS } from '@/constants'
import { PrivilegeGate } from '@/components/auth/privilege-gate'
import { useScreenReady } from '@/hooks/use-screen-ready'
import { useThirteenth, useThirteenthPayFirst, useThirteenthPaySecond } from '@/hooks/useThirteenth'
import { getThirteenthFirstDocument, getThirteenthSecondDocument } from '@/api-client'
import { getNumericValue } from '@/config/list/hr/thirteenths'
import { formatCurrency, formatDate } from '@/utils'
import { ThirteenthDetail } from '@/components/human-resources/thirteenth/thirteenth-detail'

export default function ThirteenthDetailScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const id = params.id as string

  const { data, isLoading, isRefetching, error, refetch } = useThirteenth(id, {
    include: { user: { include: { position: true, sector: true } } },
  })
  const thirteenth = (data?.data as any) ?? null

  const payFirst = useThirteenthPayFirst()
  const paySecond = useThirteenthPaySecond()

  const [reciboLoading, setReciboLoading] = useState<1 | 2 | null>(null)

  useScreenReady(!isLoading)

  const confirmPay = (installment: 1 | 2) => {
    const label = installment === 1 ? '1ª parcela' : '2ª parcela'
    Alert.alert(`Pagar ${label}`, `Confirmar pagamento da ${label} do 13º salário?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            if (installment === 1) await payFirst.mutateAsync({ id })
            else await paySecond.mutateAsync({ id })
            refetch()
          } catch {
            // interceptor toasts errors
          }
        },
      },
    ])
  }

  const openRecibo = async (installment: 1 | 2) => {
    setReciboLoading(installment)
    try {
      const res = installment === 1 ? await getThirteenthFirstDocument(id) : await getThirteenthSecondDocument(id)
      const doc = (res?.data as any) ?? null
      if (!doc) {
        Alert.alert('Recibo', 'Recibo não disponível.')
        return
      }
      const lines = [
        `13º Salário — ${installment}ª parcela / ${doc.year}`,
        `Colaborador: ${doc.userName ?? thirteenth?.user?.name ?? '—'}`,
        `Avos: ${doc.avos}/12`,
        `Base média: ${formatCurrency(getNumericValue(doc.baseRemuneration))}`,
        `Valor devido (ano): ${formatCurrency(getNumericValue(doc.fullEntitlement))}`,
        `Parcela bruta: ${formatCurrency(getNumericValue(doc.grossInstallment))}`,
        ...(installment === 2
          ? [
              `INSS: ${formatCurrency(getNumericValue(doc.inss))}`,
              `IRRF: ${formatCurrency(getNumericValue(doc.irrf))}`,
            ]
          : ['Sem descontos (1ª parcela)']),
        `Parcela líquida: ${formatCurrency(getNumericValue(doc.netInstallment))}`,
        `Vencimento: ${formatDate(doc.dueDate)}`,
      ]
      Alert.alert(`Recibo — ${installment}ª parcela`, lines.join('\n'))
    } catch {
      // interceptor toasts errors
    } finally {
      setReciboLoading(null)
    }
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar 13º salário" detail={(error as any)?.message} onRetry={() => refetch()} />
      </ThemedView>
    )
  }

  if (isLoading && !isRefetching) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Skeleton width="40%" height={18} />
              {[1, 2, 3, 4].map((j) => (
                <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Skeleton width="35%" height={14} />
                  <Skeleton width="30%" height={14} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    )
  }

  if (!thirteenth) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState icon="file-text" title="13º não encontrado" description="Nenhum registro de 13º salário encontrado." />
      </ThemedView>
    )
  }

  const status = thirteenth.status as THIRTEENTH_STATUS
  const firstPaid = status === THIRTEENTH_STATUS.FIRST_PAID || status === THIRTEENTH_STATUS.SECOND_PAID || status === THIRTEENTH_STATUS.PAID
  const secondPaid = status === THIRTEENTH_STATUS.SECOND_PAID || status === THIRTEENTH_STATUS.PAID
  const cancelled = status === THIRTEENTH_STATUS.CANCELLED

  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL] }}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        >
          <ThirteenthDetail thirteenth={thirteenth} />

          {/* Pay actions + recibos */}
          <Card style={styles.card}>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.installmentRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.installmentTitle}>1ª parcela</ThemedText>
                  <ThemedText style={styles.installmentHint}>50% · sem descontos · venc. ≤ 30/Nov</ThemedText>
                  {thirteenth.firstInstallmentDate && (
                    <ThemedText style={styles.installmentHint}>Pago em {formatDate(thirteenth.firstInstallmentDate)}</ThemedText>
                  )}
                </View>
                <View style={styles.installmentActions}>
                  <Button size="sm" variant="outline" onPress={() => openRecibo(1)} loading={reciboLoading === 1}>
                    Recibo
                  </Button>
                  {!cancelled && !firstPaid && (
                    <Button size="sm" onPress={() => confirmPay(1)} loading={payFirst.isPending}>
                      Pagar 1ª
                    </Button>
                  )}
                  {firstPaid && (
                    <Badge variant="completed" size="sm">
                      Paga
                    </Badge>
                  )}
                </View>
              </View>

              <View style={[styles.installmentRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.installmentTitle}>2ª parcela</ThemedText>
                  <ThemedText style={styles.installmentHint}>INSS + IRRF (base exclusiva) · venc. ≤ 20/Dez</ThemedText>
                  {thirteenth.secondInstallmentDate && (
                    <ThemedText style={styles.installmentHint}>Pago em {formatDate(thirteenth.secondInstallmentDate)}</ThemedText>
                  )}
                </View>
                <View style={styles.installmentActions}>
                  <Button size="sm" variant="outline" onPress={() => openRecibo(2)} loading={reciboLoading === 2}>
                    Recibo
                  </Button>
                  {!cancelled && firstPaid && !secondPaid && (
                    <Button size="sm" onPress={() => confirmPay(2)} loading={paySecond.isPending}>
                      Pagar 2ª
                    </Button>
                  )}
                  {secondPaid && (
                    <Badge variant="completed" size="sm">
                      Paga
                    </Badge>
                  )}
                </View>
              </View>

              {!firstPaid && !cancelled && (
                <ThemedText style={[styles.installmentHint, { marginTop: spacing.sm }]}>
                  Pague a 1ª parcela antes de liberar a 2ª.
                </ThemedText>
              )}
            </CardContent>
          </Card>
        </ScrollView>
      </ThemedView>
    </PrivilegeGate>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { marginBottom: spacing.md },
  installmentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  installmentTitle: { fontSize: 15, fontWeight: '600' },
  installmentHint: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  installmentActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
})
