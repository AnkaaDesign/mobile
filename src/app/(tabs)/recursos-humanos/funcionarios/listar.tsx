import { Layout } from '@/components/list/Layout'
import { employeesListConfig } from '@/config/list/hr/employees'

export default function EmployeeListScreen() {
  return <Layout config={employeesListConfig} />
}
