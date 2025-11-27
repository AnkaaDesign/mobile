import { PrivilegeGuard } from '@/components/privilege-guard'
import { SECTOR_PRIVILEGES } from '@/constants'
import { Layout } from '@/components/list/Layout'
import { myTeamWarningsListConfig } from '@/config/list/my-team'

/**
 * My Team Warnings List Page
 * Shows all warnings for users in the team leader's managed sector
 * The API endpoint handles the filtering based on the user's managedSectorId
 */
export default function MyTeamWarningsScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.LEADER}>
      <Layout config={myTeamWarningsListConfig} />
    </PrivilegeGuard>
  )
}
