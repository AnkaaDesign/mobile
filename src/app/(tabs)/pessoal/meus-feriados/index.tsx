import { Layout } from '@/components/list/Layout'
import { personalHolidaysListConfig } from '@/config/list/personal'

export default function MyHolidaysScreen() {
  return <Layout config={personalHolidaysListConfig} />
}
