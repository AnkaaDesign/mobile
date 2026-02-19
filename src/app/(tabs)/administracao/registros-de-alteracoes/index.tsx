import { Redirect } from "expo-router";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AdministrationChangeLogsIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/administracao/registros-de-alteracoes/listar" />;
}
