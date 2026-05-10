import { PPEForm } from "@/components/inventory/ppe/form/ppe-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreatePPEScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <PPEForm key={formKey} mode="create" />
    </PrivilegeGate>
  );
}
