import { useMemo } from 'react'
import { Layout } from '@/components/list/Layout'
import { teamVacationsListConfig } from '@/config/list/my-team/vacations'
import { useAuth } from '@/contexts/auth-context'
import { PrivilegeGuard } from '@/components/privilege-guard'
import { SECTOR_PRIVILEGES } from '@/constants'
import { ThemedView } from '@/components/ui/themed-view'
import { EmptyState } from '@/components/ui/empty-state'
import type { ListConfig } from '@/components/list/types'
import type { Vacation } from '@/types'

function MyTeamVacationsContent() {
  const { data: user } = useAuth()

  // Create a modified config that filters vacations by user's sector team members
  const config = useMemo((): ListConfig<Vacation> => {
    if (!user?.sectorId) return teamVacationsListConfig

    return {
      ...teamVacationsListConfig,
      query: {
        ...teamVacationsListConfig.query,
        where: {
          user: {
            sectorId: user.sectorId,
          },
        },
      },
    }
  }, [user?.sectorId])

  if (!user?.sectorId) {
    return (
      <ThemedView style={{ flex: 1 }}>
        <EmptyState
          icon="alert-circle"
          title="Setor não encontrado"
          description="Você precisa estar associado a um setor para visualizar as férias da equipe"
        />
      </ThemedView>
    )
  }

  return <Layout config={config} />
}

export default function MyTeamVacationsListScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <MyTeamVacationsContent />
    </PrivilegeGuard>
  )
}
