import { Layout } from '@/components/list/Layout'
import { servicesListConfig } from '@/config/list/production/services'

export default function ServicesListScreen() {
  return <Layout config={servicesListConfig} />
}
