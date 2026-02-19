import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateHRPPEScreen() {
  useScreenReady();
  return <UnderConstruction title="Cadastrar PPE" description="Adicione novos equipamentos de proteção individual ao sistema em breve." />;
}
