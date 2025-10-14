import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../constants';
import { UnderConstruction } from "@/components/ui/under-construction";

export default function AdministrationScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.ADMIN, SECTOR_PRIVILEGES.HUMAN_RESOURCES]}>
      <UnderConstruction title="Administração" />
    </PrivilegeGuard>
  );
}
