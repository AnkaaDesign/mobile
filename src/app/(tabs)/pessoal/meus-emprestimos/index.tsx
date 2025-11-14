import { Layout } from '@/components/list/Layout'
import { personalBorrowsListConfig } from '@/config/list/personal'

export default function MyBorrowsScreen() {
  return <Layout config={personalBorrowsListConfig} />
}
