import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateExternalWithdrawalScreen() {
  useScreenReady();
  return (
    <UnderConstruction
      title="Cadastrar Retirada Externa"
      description="O formulário para cadastrar retiradas externas estará disponível em breve. Você poderá registrar novas retiradas de produtos do estoque."
    />
  );
}
