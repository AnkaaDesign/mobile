import { Layout } from '@/components/list/Layout'
import { holidaysListConfig } from '@/config/list/hr/holidays'

export default function HolidayListScreen() {
  return <Layout config={holidaysListConfig} />
}
