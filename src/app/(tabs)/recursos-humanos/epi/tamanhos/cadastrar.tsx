import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreatePPESizeScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <UnderConstruction key={formKey} title="Cadastrar Tamanho de PPE" description="Configure novos tamanhos para os equipamentos de proteção individual em breve." />;
}
