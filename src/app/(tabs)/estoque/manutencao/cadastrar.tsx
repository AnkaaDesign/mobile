import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateMaintenanceScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <MaintenanceForm key={formKey} mode="create" />
    </PrivilegeGate>
  );
}
