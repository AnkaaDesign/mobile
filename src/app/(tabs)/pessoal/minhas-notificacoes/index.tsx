import { Layout } from '@/components/list/Layout'
import { personalNotificationsListConfig } from '@/config/list/personal'

export default function MyNotificationsScreen() {
  return <Layout config={personalNotificationsListConfig} />
}
