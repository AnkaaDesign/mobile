import { Layout } from '@/components/list/Layout'
import { personalEmployeesListConfig } from '@/config/list/personal/employees'

export default function PersonalEmployeesListScreen() {
  return <Layout config={personalEmployeesListConfig} />
}
