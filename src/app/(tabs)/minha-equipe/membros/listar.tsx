import { Layout } from '@/components/list/Layout'
import { teamMembersListConfig } from '@/config/list/my-team/team-members'

export default function TeamMembersListScreen() {
  return <Layout config={teamMembersListConfig} />
}
