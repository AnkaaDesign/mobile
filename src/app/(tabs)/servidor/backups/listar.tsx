import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { Layout } from "@/components/list/Layout";
import { backupsListConfig } from "@/config/list/administration/backups";

export default function BackupsListScreen() {
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Layout config={backupsListConfig} />
    </PrivilegeGate>
  );
}
