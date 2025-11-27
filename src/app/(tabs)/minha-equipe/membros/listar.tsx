import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { teamMembersListConfig } from '@/config/list/my-team/team-members'
import { useCurrentUser } from '@/hooks'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Card } from '@/components/ui/card'
import { useTheme } from '@/lib/theme'
import { IconUsers } from '@tabler/icons-react-native'
import { spacing, fontSize } from '@/constants/design-system'
import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'

export default function TeamMembersListScreen() {
  const { colors } = useTheme()
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()

  // Check if user is a team leader
  const isTeamLeader = !!currentUser?.managedSectorId

  // Create custom config with forcedParams to filter by managed sector
  const customConfig: ListConfig<User> = useMemo(() => {
    if (!currentUser?.managedSectorId) {
      return teamMembersListConfig
    }

    return {
      ...teamMembersListConfig,
      query: {
        ...teamMembersListConfig.query,
        // Use forcedParams with sectorIds array - this is what the API expects
        forcedParams: {
          sectorIds: [currentUser.managedSectorId],
        },
      },
    }
  }, [currentUser?.managedSectorId])

  // Show loading while fetching current user
  if (isLoadingUser) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Card style={styles.card}>
            <ThemedText style={{ color: colors.mutedForeground }}>
              Carregando...
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    )
  }

  // Show access denied if not a team leader
  if (!isTeamLeader) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Card style={styles.card}>
            <IconUsers size={48} color={colors.mutedForeground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Acesso Restrito
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Esta área é exclusiva para líderes de equipe.
            </ThemedText>
          </Card>
        </View>
      </ThemedView>
    )
  }

  return <Layout config={customConfig} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
})
