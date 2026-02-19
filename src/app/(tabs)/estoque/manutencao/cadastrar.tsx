import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateMaintenanceScreen() {
  useScreenReady();
  return <MaintenanceForm mode="create" />;
}
