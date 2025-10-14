import React from "react";
import { PrivilegeGuard } from "@/components/privilege-guard";
import { SECTOR_PRIVILEGES } from '../../constants';
import { UnderConstruction } from "@/components/ui/under-construction";

export default function PaintingScreen() {
  return (
    <PrivilegeGuard requiredPrivilege={[SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN]}>
      <UnderConstruction title="Pintura" />
    </PrivilegeGuard>
  );
}
