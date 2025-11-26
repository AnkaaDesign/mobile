import { Layout } from '@/components/list/Layout'
import { usersListConfig } from '@/config/list/administration/users'

export default function AdministrationUsersListScreen() {
  return <Layout config={usersListConfig} />
}
