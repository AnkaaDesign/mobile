import { Layout } from '@/components/list/Layout'
import { deploymentsListConfig } from '@/config/list/administration/deployments'

export default function DeploymentsListScreen() {
  return <Layout config={deploymentsListConfig} />
}
