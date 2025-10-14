import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../constants';
import { UnderConstruction } from "@/components/ui/under-construction";

export default function MaintenanceDetailsScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={SECTOR_PRIVILEGES.MAINTENANCE}>
      <UnderConstruction title="Manutenção - Detalhes" />
    </PrivilegeGuard>
  );
}
