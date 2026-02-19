import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FolhaDePagamentoIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/recursos-humanos/folha-de-pagamento/listar" />;
}
