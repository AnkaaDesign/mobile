import { Redirect, useLocalSearchParams } from 'expo-router';

// Redirect to new meu-bonus/detalhes route
export default function BonusDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/pessoal/meu-bonus/detalhes/${id}`} />;
}
