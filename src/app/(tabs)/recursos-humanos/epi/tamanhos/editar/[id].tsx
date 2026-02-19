import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EditPPESizeScreen() {
  useScreenReady();
  return <UnderConstruction title="Editar Tamanho de PPE" description="Atualize as configurações de tamanho do equipamento de proteção individual em breve." />;
}
