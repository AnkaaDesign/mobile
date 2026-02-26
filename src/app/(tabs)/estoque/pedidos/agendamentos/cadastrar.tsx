import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function InventoryOrderSchedulesCreateScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <UnderConstruction key={formKey} title="Agendamentos de Pedidos - Cadastrar" />;
}
