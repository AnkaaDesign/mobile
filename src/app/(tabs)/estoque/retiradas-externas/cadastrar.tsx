import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateExternalWithdrawalScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <UnderConstruction
      key={formKey}
      title="Cadastrar Retirada Externa"
      description="O formulário para cadastrar retiradas externas estará disponível em breve. Você poderá registrar novas retiradas de produtos do estoque."
    />
  );
}
