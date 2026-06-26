import { Layout } from '@/components/list/Layout'
import { employeesListConfig } from '@/config/list/personnel-department/employees'

export default function EmployeeListScreen() {
  return <Layout config={employeesListConfig} />
}
