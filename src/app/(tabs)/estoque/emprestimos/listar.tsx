import { Layout } from '@/components/list/Layout'
import { borrowsListConfig } from '@/config/list/inventory/borrows'

export default function BorrowListScreen() {
  return <Layout config={borrowsListConfig} />
}
