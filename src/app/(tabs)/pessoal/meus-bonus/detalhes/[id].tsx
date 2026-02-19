import { Redirect, useLocalSearchParams } from 'expo-router';
import { useScreenReady } from '@/hooks/use-screen-ready';

// Redirect to new meu-bonus/detalhes route
export default function BonusDetailRedirect() {
  useScreenReady();
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/pessoal/meu-bonus/detalhes/${id}`} />;
}
