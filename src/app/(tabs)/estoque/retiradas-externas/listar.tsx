import { Layout } from '@/components/list/Layout'
import { externalWithdrawalsListConfig } from '@/config/list/inventory/external-withdrawals'

export default function ExternalWithdrawalListScreen() {
  return <Layout config={externalWithdrawalsListConfig} />
}
