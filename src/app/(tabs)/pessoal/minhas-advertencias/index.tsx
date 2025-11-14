import { Layout } from '@/components/list/Layout'
import { personalWarningsListConfig } from '@/config/list/personal'

export default function MyWarningsScreen() {
  return <Layout config={personalWarningsListConfig} />
}
