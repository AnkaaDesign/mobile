import { useMemo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { PrivilegeGuard } from '@/components/privilege-guard'
import { SECTOR_PRIVILEGES } from '@/constants'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Layout } from '@/components/list/Layout'
import { myTeamBorrowsListConfig } from '@/config/list/my-team'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/lib/theme'
import type { ListConfig } from '@/components/list/types'
import type { Borrow } from '@/types'

/**
 * My Team Borrows List Page
 * Shows all borrows for users in the team leader's managed sector
 */
export default function MyTeamBorrowsScreen() {
  const { colors } = useTheme()
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()

  // Build where clause to filter by team members in the managed sector
  const buildWhereClause = useCallback(
    (baseWhere: any) => {
      if (!currentUser?.managedSectorId) return baseWhere

      return {
        ...baseWhere,
        user: {
          sectorId: currentUser.managedSectorId,
        },
      }
    },
    [currentUser?.managedSectorId]
  )

  // Customize config with dynamic where clause
  const customConfig: ListConfig<Borrow> = useMemo(() => {
    return {
      ...myTeamBorrowsListConfig,
      query: {
        ...myTeamBorrowsListConfig.query,
        whereTransform: buildWhereClause,
      },
    }
  }, [buildWhereClause])

  // Show loading while we fetch user data
  if (isLoadingUser) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.loadingContainer}>
            <ThemedText>Carregando empréstimos da equipe...</ThemedText>
          </View>
        </ThemedView>
      </PrivilegeGuard>
    )
  }

  // Show error if user doesn't manage a sector
  if (!currentUser?.managedSectorId) {
    return (
      <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
        <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <ThemedText style={[styles.errorText, { color: colors.mutedForeground }]}>
              Você precisa gerenciar um setor para visualizar os empréstimos da equipe.
            </ThemedText>
          </View>
        </ThemedView>
      </PrivilegeGuard>
    )
  }

  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <Layout config={customConfig} />
    </PrivilegeGuard>
  )
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
})
