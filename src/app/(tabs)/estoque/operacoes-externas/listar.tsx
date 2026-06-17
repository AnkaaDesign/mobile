import { Layout } from '@/components/list/Layout'
import { PrivilegeGate } from '@/components/auth/privilege-gate'
import { SECTOR_PRIVILEGES } from '@/constants'
import { externalOperationsListConfig } from '@/config/list/inventory/external-operations'

export default function ExternalOperationListScreen() {
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN] }}>
      <Layout config={externalOperationsListConfig} />
    </PrivilegeGate>
  )
}
