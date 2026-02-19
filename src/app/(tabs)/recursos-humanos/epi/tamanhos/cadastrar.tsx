import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreatePPESizeScreen() {
  useScreenReady();
  return <UnderConstruction title="Cadastrar Tamanho de PPE" description="Configure novos tamanhos para os equipamentos de proteção individual em breve." />;
}
