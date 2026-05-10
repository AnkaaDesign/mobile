import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function CreateCollaboratorScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] }}>
      <CollaboratorForm key={formKey} mode="create" />
    </PrivilegeGate>
  );
}
