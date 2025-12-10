import { SECTOR_PRIVILEGES } from '@/constants';
import { PrivilegeGuard } from "@/components/privilege-guard";
import { Layout } from "@/components/list/Layout";
import { payrollListConfig } from "@/config/list/hr";

/**
 * Payroll List Screen
 * Uses the standard list system Layout component with payrollListConfig
 */
export default function PayrollListScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.FINANCIAL]}>
      <Layout config={payrollListConfig} />
    </PrivilegeGuard>
  );
}
