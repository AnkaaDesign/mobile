import { Layout } from '@/components/list/Layout'
import { billingListConfig } from '@/config/list/financial/billing'

export default function BillingListScreen() {
  return <Layout config={billingListConfig} />
}
