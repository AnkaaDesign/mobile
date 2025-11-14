import { Layout } from '@/components/list/Layout'
import { filesListConfig } from '@/config/list/administration/files'

export default function FileListScreen() {
  return <Layout config={filesListConfig} />
}
