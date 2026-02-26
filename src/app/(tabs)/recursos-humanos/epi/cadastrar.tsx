import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateHRPPEScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <UnderConstruction key={formKey} title="Cadastrar PPE" description="Adicione novos equipamentos de proteção individual ao sistema em breve." />;
}
