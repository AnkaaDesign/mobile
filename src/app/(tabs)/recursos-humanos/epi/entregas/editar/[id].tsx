import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function EditHRPPEDeliveryScreen() {
  useScreenReady();
  return <UnderConstruction title="Editar Entrega de PPE" description="Atualize as informações da entrega de equipamentos de proteção individual em breve." />;
}
