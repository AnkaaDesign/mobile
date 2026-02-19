import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function InventoryOrderSchedulesCreateScreen() {
  useScreenReady();
  return <UnderConstruction title="Agendamentos de Pedidos - Cadastrar" />;
}
