import { Layout } from '@/components/list/Layout'
import { personalNotificationsListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MyNotificationsScreen() {
  return <Layout config={personalNotificationsListConfig} />
}
