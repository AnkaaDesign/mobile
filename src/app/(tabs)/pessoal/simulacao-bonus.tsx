import { Redirect } from 'expo-router';

// Redirect to new meu-bonus/simulacao route
export default function SimulacaoBonusRedirect() {
  return <Redirect href="/(tabs)/pessoal/meu-bonus/simulacao" />;
}
