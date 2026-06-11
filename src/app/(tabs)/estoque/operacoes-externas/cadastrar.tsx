import { ExternalOperationCreateForm } from "@/components/inventory/external-operation/form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES } from "@/constants";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateExternalOperationScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN] }}>
      <ExternalOperationCreateForm key={formKey} />
    </PrivilegeGate>
  );
}
