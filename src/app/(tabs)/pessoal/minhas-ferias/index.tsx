import { Layout } from '@/components/list/Layout'
import { personalVacationsListConfig } from '@/config/list/personal'

export default function MyVacationsScreen() {
  return <Layout config={personalVacationsListConfig} />
}
