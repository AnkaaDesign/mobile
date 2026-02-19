import { Redirect } from 'expo-router';
import { useScreenReady } from '@/hooks/use-screen-ready';

// Redirect to new meu-bonus route
export default function MyBonusesRedirect() {
  useScreenReady();
  return <Redirect href="/(tabs)/pessoal/meu-bonus" />;
}
