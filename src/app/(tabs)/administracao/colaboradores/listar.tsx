import { Layout } from '@/components/list/Layout'
import { collaboratorsListConfig } from '@/config/list/administration/collaborators'

export default function AdministrationEmployeesListScreen() {
  return <Layout config={collaboratorsListConfig} />
}
