import { Layout } from '@/components/list/Layout'
import { customersListConfig } from '@/config/list/administration/customers'

export default function CustomerListScreen() {
  return <Layout config={customersListConfig} />
}
