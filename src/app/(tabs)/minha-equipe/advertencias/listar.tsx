import { useMemo } from 'react'
import { Layout } from '@/components/list/Layout'
import { myTeamWarningsListConfig } from '@/config/list/my-team/warnings'
import { useAuth } from '@/contexts/auth-context'
import { PrivilegeGuard } from '@/components/privilege-guard'
import { SECTOR_PRIVILEGES } from '@/constants'
import { ThemedView } from '@/components/ui/themed-view'
import { EmptyState } from '@/components/ui/empty-state'
import type { ListConfig } from '@/components/list/types'
import type { Warning } from '@/types'

function MyTeamWarningsContent() {
  const { user } = useAuth()

  // Create a modified config that filters warnings by user's sector
  const config = useMemo((): ListConfig<Warning> => {
    if (!user?.sectorId) return myTeamWarningsListConfig

    return {
      ...myTeamWarningsListConfig,
      query: {
        ...myTeamWarningsListConfig.query,
        where: {
          collaborator: {
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
          description="Você precisa estar associado a um setor para visualizar as advertências da equipe"
        />
      </ThemedView>
    )
  }

  return <Layout config={config} />
}

export default function MyTeamWarningsListScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <MyTeamWarningsContent />
    </PrivilegeGuard>
  )
}
