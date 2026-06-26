import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedView, ThemedText, Card, CardContent, EmptyState, ErrorScreen, Skeleton } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { spacing } from '@/constants/design-system'
import { useScreenReady } from '@/hooks/use-screen-ready'
import { useCurrentUser } from '@/hooks/useAuth'
import { useThirteenth } from '@/hooks/useThirteenth'
import { ThirteenthDetail } from '@/components/personnel-department/thirteenth/thirteenth-detail'
import { formatDate } from '@/utils'

export default function MyThirteenthDetailScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const id = params.id as string

  const { data: currentUser } = useCurrentUser()
  const { data, isLoading, isRefetching, error, refetch } = useThirteenth(id, {
    include: { user: { include: { position: true } } },
  })
  const thirteenth = (data?.data as any) ?? null

  useScreenReady(!isLoading)

  // Self-service guard: only show the logged-in user's own record.
  const belongsToUser = thirteenth && currentUser?.id && thirteenth.userId === currentUser.id

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar seu 13º" detail={(error as any)?.message} onRetry={() => refetch()} />
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
              {[1, 2, 3].map((j) => (
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

  if (!thirteenth || !belongsToUser) {
    return (
      <ThemedView style={styles.container}>
        <EmptyState icon="file-text" title="13º não encontrado" description="Nenhum registro de 13º salário disponível." />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <ThirteenthDetail thirteenth={thirteenth} />

        {/* Payment dates (read-only) */}
        {(thirteenth.firstInstallmentDate || thirteenth.secondInstallmentDate) && (
          <Card style={styles.card}>
            <CardContent>
              {thirteenth.firstInstallmentDate && (
                <View style={styles.row}>
                  <ThemedText style={styles.label}>1ª parcela paga em</ThemedText>
                  <ThemedText style={styles.value}>{formatDate(thirteenth.firstInstallmentDate)}</ThemedText>
                </View>
              )}
              {thirteenth.secondInstallmentDate && (
                <View style={styles.row}>
                  <ThemedText style={styles.label}>2ª parcela paga em</ThemedText>
                  <ThemedText style={styles.value}>{formatDate(thirteenth.secondInstallmentDate)}</ThemedText>
                </View>
              )}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 14, opacity: 0.7 },
  value: { fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
})
