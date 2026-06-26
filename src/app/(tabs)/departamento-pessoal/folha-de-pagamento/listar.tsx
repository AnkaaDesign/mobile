import { SECTOR_PRIVILEGES } from "@/constants";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { Layout } from "@/components/list/Layout";
import { payrollListConfig } from "@/config/list/personnel-department";

/**
 * Payroll List Screen
 * Uses the standard list system Layout component with payrollListConfig
 */
export default function PayrollListScreen() {
  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.HUMAN_RESOURCES,
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.FINANCIAL,
        ],
      }}
    >
      <Layout config={payrollListConfig} />
    </PrivilegeGate>
  );
}
