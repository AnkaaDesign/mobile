import { Layout } from '@/components/list/Layout'
import { customersListConfig } from '@/config/list/administration/customers'

export default function FinancialCustomerListScreen() {
  return <Layout config={customersListConfig} />
}
