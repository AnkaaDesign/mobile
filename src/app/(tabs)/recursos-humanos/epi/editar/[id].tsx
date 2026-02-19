import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EditPPEScreen() {
  useScreenReady();
  return <UnderConstruction title="Editar PPE" description="Atualize as informações do equipamento de proteção individual em breve." />;
}
