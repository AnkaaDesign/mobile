import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { AutoOrderList } from "@/components/inventory/auto-order";
import { SECTOR_PRIVILEGES } from "@/constants";

export default function AutomaticOrderListScreen() {
  return (
    <PrivilegeGate
      required={{ any: [SECTOR_PRIVILEGES.WAREHOUSE, SECTOR_PRIVILEGES.ADMIN] }}
    >
      <AutoOrderList />
    </PrivilegeGate>
  );
}
