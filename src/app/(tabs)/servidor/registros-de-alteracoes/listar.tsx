import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { Layout } from '@/components/list/Layout'
import { changeLogsListConfig } from '@/config/list/administration/change-logs'

export default function ServerChangeLogsListScreen() {
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Layout config={changeLogsListConfig} />
    </PrivilegeGate>
  );
}
