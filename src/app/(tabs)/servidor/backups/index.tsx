import { Redirect } from "expo-router";

export default function BackupsIndex() {
  return <Redirect href="/(tabs)/servidor/backups/listar" />;
}
