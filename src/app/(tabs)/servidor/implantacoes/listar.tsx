import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { Layout } from '@/components/list/Layout'
import { deploymentsListConfig } from '@/config/list/administration/deployments'

export default function DeploymentsListScreen() {
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Layout config={deploymentsListConfig} />
    </PrivilegeGate>
  );
}
