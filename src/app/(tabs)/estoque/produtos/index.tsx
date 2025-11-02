import { Redirect } from "expo-router";

export default function ProdutosIndex() {
  return <Redirect href="/(tabs)/estoque/produtos/listar" />;
}
