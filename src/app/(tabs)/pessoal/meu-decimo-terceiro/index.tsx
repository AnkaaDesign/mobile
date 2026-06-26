import { useMemo } from 'react'
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ThemedView,
  ThemedText,
  Card,
  CardContent,
  Badge,
  EmptyState,
  ErrorScreen,
  Skeleton,
} from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { spacing } from '@/constants/design-system'
import { useScreenReady } from '@/hooks/use-screen-ready'
import { useCurrentUser } from '@/hooks/useAuth'
import { useThirteenths } from '@/hooks/useThirteenth'
import {
  thirteenthStatusBadgeVariant,
  getThirteenthStatusLabel,
  getNumericValue,
} from '@/config/list/personnel-department/thirteenths'
import { formatCurrency } from '@/utils'
import type { Thirteenth } from '@/types'

export default function MyThirteenthListScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const userId = currentUser?.id

  const filters = useMemo(
    () => ({
      userId,
      orderBy: { year: 'desc' as const },
      limit: 50,
    }),
    [userId],
  )

  const { data, isLoading, isRefetching, error, refetch } = useThirteenths(filters, { enabled: !!userId })
  const records: Thirteenth[] = (data?.data as Thirteenth[]) ?? []

  const loading = userLoading || isLoading
  useScreenReady(!loading)

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen message="Erro ao carregar seu 13º" detail={(error as any)?.message} onRetry={() => refetch()} />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        {loading ? (
          [1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.sm,
                gap: spacing.sm,
              }}
            >
              <Skeleton width="40%" height={16} />
              <Skeleton width="75%" height={12} />
            </View>
          ))
        ) : records.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="Nenhum 13º registrado"
            description="Você ainda não possui registros de 13º salário."
          />
        ) : (
          records.map((t) => {
            const variant = thirteenthStatusBadgeVariant[t.status] ?? 'default'
            return (
              <Pressable key={t.id} onPress={() => router.push(`/pessoal/meu-decimo-terceiro/detalhes/${t.id}`)}>
                <Card style={styles.rowCard}>
                  <CardContent>
                    <View style={styles.rowHeader}>
                      <ThemedText style={styles.rowYear}>13º · {t.year}</ThemedText>
                      <Badge variant={variant} size="sm">
                        {getThirteenthStatusLabel(t.status)}
                      </Badge>
                    </View>
                    <View style={styles.rowMeta}>
                      <Meta label="Avos" value={`${t.avos}/12`} colors={colors} />
                      <Meta
                        label="1ª parcela"
                        value={t.firstInstallment != null ? formatCurrency(getNumericValue(t.firstInstallment)) : '—'}
                        colors={colors}
                      />
                      <Meta
                        label="2ª parcela"
                        value={t.secondInstallment != null ? formatCurrency(getNumericValue(t.secondInstallment)) : '—'}
                        colors={colors}
                      />
                    </View>
                  </CardContent>
                </Card>
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </ThemedView>
  )
}

function Meta({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.meta}>
      <ThemedText style={[styles.metaLabel, { color: colors.mutedForeground ?? colors.text }]}>{label}</ThemedText>
      <ThemedText style={styles.metaValue}>{value}</ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  rowCard: { marginBottom: spacing.sm },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  rowYear: { fontSize: 16, fontWeight: '600' },
  rowMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  meta: { flex: 1 },
  metaLabel: { fontSize: 11, opacity: 0.7 },
  metaValue: { fontSize: 14, fontWeight: '500', fontFamily: 'monospace' },
})
