import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormScreenKey } from "@/hooks/use-form-screen-key";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function EmployeesCreateScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  const nav = useNav();

  const handleSuccess = (id?: string) => {
    if (id) {
      nav.replace(mobileRoute(`/recursos-humanos/funcionarios/detalhes/${id}`));
    } else {
      nav.goBack();
    }
  };

  return (
    <PrivilegeGate required={{ any: [SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES] }}>
      <CollaboratorForm key={formKey} mode="create" onSuccess={handleSuccess} />
    </PrivilegeGate>
  );
}
