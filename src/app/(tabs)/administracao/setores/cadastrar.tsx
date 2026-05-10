import { SectorForm } from "@/components/administration/sector/form/sector-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateSectorScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate required={SECTOR_PRIVILEGES.ADMIN}>
      <SectorForm key={formKey} mode="create" />
    </PrivilegeGate>
  );
}
