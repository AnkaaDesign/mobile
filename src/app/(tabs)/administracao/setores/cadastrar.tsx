import { SectorForm } from "@/components/administration/sector/form/sector-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateSectorScreen() {
  useScreenReady();
  return <SectorForm mode="create" />;
}
