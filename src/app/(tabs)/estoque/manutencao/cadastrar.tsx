import { MaintenanceForm } from "@/components/inventory/maintenance/form/maintenance-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateMaintenanceScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <MaintenanceForm key={formKey} mode="create" />;
}
