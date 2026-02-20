import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from "@/constants/enums";
import { Layout } from "@/components/list/Layout";
import { backupSchedulesListConfig } from "@/config/list/administration/backup-schedules";

export default function BackupScheduleScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <Layout config={backupSchedulesListConfig} />
    </PrivilegeGuard>
  );
}
