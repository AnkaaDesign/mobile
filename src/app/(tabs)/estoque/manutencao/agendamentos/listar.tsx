import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MaintenanceScheduleListScreen() {
  useScreenReady();
  return <UnderConstruction title="Agendamentos de Manutenção" />;
}
