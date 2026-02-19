import { UnderConstruction } from "@/components/ui/under-construction";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PositionRemunerationsScreen() {
  useScreenReady();
  return <UnderConstruction title="Remunerações do Cargo" />;
}
