import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function ChangeLogEntityScreen() {
  useScreenReady();
  return (
    <UnderConstruction
      title="Registros da Entidade"
      description="Histórico completo de alterações para uma entidade específica, mostrando todas as modificações realizadas ao longo do tempo."
      icon="history"
    />
  );
}
