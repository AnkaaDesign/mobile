import { Layout } from '@/components/list/Layout'
import { personalBonusesListConfig } from '@/config/list/personal'
import { useCurrentUser } from '@/hooks/useAuth'
import { ThemedView, EmptyState } from '@/components/ui'
import { useTheme } from '@/lib/theme'
import { ActivityIndicator, View, StyleSheet } from 'react-native'

export default function BonusHistoryScreen() {
  const { colors } = useTheme()
  const { data: currentUser, isLoading } = useCurrentUser()

  // Check if user's position is bonifiable
  const isBonifiable = currentUser?.position?.bonifiable ?? false

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
