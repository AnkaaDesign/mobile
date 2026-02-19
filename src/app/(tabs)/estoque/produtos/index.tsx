import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProdutosIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/estoque/produtos/listar" />;
}
