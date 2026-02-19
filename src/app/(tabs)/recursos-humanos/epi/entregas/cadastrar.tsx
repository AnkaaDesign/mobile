import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateHRPPEDeliveriesScreen() {
  useScreenReady();
  return <UnderConstruction title="Cadastrar Entrega de PPE" description="Registre novas entregas de equipamentos de proteção individual aos funcionários em breve." />;
}
