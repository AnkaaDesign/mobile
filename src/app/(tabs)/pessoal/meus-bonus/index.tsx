import { Redirect } from 'expo-router';

// Redirect to new meu-bonus route
export default function MyBonusesRedirect() {
  return <Redirect href="/(tabs)/pessoal/meu-bonus" />;
}
