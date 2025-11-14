import { Layout } from '@/components/list/Layout'
import { notificationsListConfig } from '@/config/list/administration/notifications'

export default function NotificationListScreen() {
  return <Layout config={notificationsListConfig} />
}
