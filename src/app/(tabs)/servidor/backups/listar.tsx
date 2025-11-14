import { Layout } from '@/components/list/Layout'
import { backupsListConfig } from '@/config/list/administration/backups'

export default function BackupsListScreen() {
  return <Layout config={backupsListConfig} />
}
