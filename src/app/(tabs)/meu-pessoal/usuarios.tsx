import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Layout } from '@/components/list/Layout'
import { teamMembersListConfig } from '@/config/list/my-team/team-members'
import { useAuth } from '@/contexts/auth-context'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Card } from '@/components/ui/card'
import { useTheme } from '@/lib/theme'
import { spacing, fontSize } from '@/constants/design-system'
import { IconUsers } from '@tabler/icons-react-native'
import { isTeamLeader } from '@/utils/user'
import type { ListConfig } from '@/components/list/types'
import type { User } from '@/types'

/**
 * Team Members List Page
 * Shows all users in the team leader's managed sector
 */
export default function TeamMembersScreen() {
  const { colors } = useTheme()
  const { user: currentUser } = useAuth()

  const userIsTeamLeader = currentUser ? isTeamLeader(currentUser) : false
  const managedSectorId = currentUser?.managedSector?.id

  // Create a modified config that filters by user's managed sector
  const config = useMemo((): ListConfig<User> => {
    if (!managedSectorId) return teamMembersListConfig

    return {
      ...teamMembersListConfig,
      query: {
        ...teamMembersListConfig.query,
        where: {
          sectorId: managedSectorId,
        },
      },
    }
  }, [managedSectorId])

  // Show access denied if not a team leader
  if (!userIsTeamLeader) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyContainer}>
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

  return <Layout config={config} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
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
