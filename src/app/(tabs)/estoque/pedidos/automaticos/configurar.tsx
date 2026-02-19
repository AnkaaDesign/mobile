import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ConfigureAutomaticOrdersScreen() {
  useScreenReady();
  return <UnderConstruction title="Configurar Pedidos Automáticos" />;
}
