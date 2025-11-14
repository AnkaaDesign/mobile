import { Layout } from '@/components/list/Layout'
import { changeLogsListConfig } from '@/config/list/administration/change-logs'

export default function AdministrationChangeLogsListScreen() {
  return <Layout config={changeLogsListConfig} />
}
