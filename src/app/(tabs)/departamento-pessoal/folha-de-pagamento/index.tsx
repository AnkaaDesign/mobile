import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FolhaDePagamentoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/departamento-pessoal/folha-de-pagamento/listar" />;
}
