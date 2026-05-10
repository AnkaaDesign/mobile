import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { Layout } from "@/components/list/Layout";
import { backupSchedulesListConfig } from "@/config/list/administration/backup-schedules";

export default function BackupScheduleScreen() {
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <Layout config={backupSchedulesListConfig} />
    </PrivilegeGate>
  );
}
