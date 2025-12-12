import { Layout } from '@/components/list/Layout'
import { myTeamWarningsListConfig } from '@/config/list/my-team'

/**
 * My Team Warnings List Page
 * Shows all warnings for users in the team leader's managed sector
 * The API endpoint handles the filtering based on the user's managedSector.id
 */
export default function MyTeamWarningsScreen() {
  return <Layout config={myTeamWarningsListConfig} />
}
