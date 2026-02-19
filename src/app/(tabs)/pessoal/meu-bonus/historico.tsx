import { Layout } from '@/components/list/Layout'
import { personalBonusesListConfig } from '@/config/list/personal'
import { useCurrentUser } from '@/hooks/useAuth'
import { useScreenReady } from '@/hooks/use-screen-ready'
import { ThemedView, EmptyState } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { View, StyleSheet } from 'react-native'
import { Skeleton } from "@/components/ui/skeleton";

export default function BonusHistoryScreen() {
  const { colors } = useTheme()
  const { data: currentUser, isLoading } = useCurrentUser()

  useScreenReady(!isLoading);

  // Check if user's position is bonifiable
  const isBonifiable = currentUser?.position?.bonifiable ?? false

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, padding: 16, gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={{ backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton style={{ height: 16, width: '30%', borderRadius: 4 }} />
                <Skeleton style={{ height: 22, width: '20%', borderRadius: 10 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton style={{ height: 13, width: '45%', borderRadius: 4 }} />
                <Skeleton style={{ height: 13, width: '25%', borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      </ThemedView>
    )
  }

  // If user's position is not bonifiable, show a message
  if (!isBonifiable) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="currency-dollar"
          title="Acesso não permitido"
          description="Seu cargo não é elegível para bônus. Entre em contato com o RH se acredita que isso é um erro."
        />
      </ThemedView>
    )
  }

  return <Layout config={personalBonusesListConfig} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
