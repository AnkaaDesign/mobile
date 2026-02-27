import { Layout } from '@/components/list/Layout'
import { messagesListConfig } from '@/config/list/administration/messages'

export default function MessageListScreen() {
  return <Layout config={messagesListConfig} />
}
