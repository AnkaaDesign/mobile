import { SectorForm } from "@/components/administration/sector/form/sector-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateSectorScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <SectorForm key={formKey} mode="create" />;
}
